package com.hotelshivar.backend.service;

import com.hotelshivar.backend.entity.CustomerAccount;
import com.hotelshivar.backend.entity.PasswordReset;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.repository.CustomerAccountRepository;
import com.hotelshivar.backend.repository.PasswordResetRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Customer "forgot password": one email with a 6-digit OTP (10 minutes, 5 tries) and a reset link (30 minutes).
 * <ul>
 *   <li>only hashes are stored (OTP: BCrypt, link token: SHA-256 of 32 random bytes);</li>
 *   <li>a request works once - using the OTP or the link closes it, and a new request closes the older ones;</li>
 *   <li>at most one email a minute and 5 an hour per account;</li>
 *   <li>the answer to "forgot password" is the same whether or not the email has an account (no account guessing).</li>
 * </ul>
 */
@Service
@Slf4j
public class PasswordResetService {

    static final int MAX_PER_HOUR = 5;
    static final int COOLDOWN_SECONDS = 60;
    private static final String BAD_CODE = "The code is wrong or has expired. Please ask for a new one.";
    private static final String BAD_LINK = "This reset link is not valid any more (it was used, replaced or has expired). Please ask for a new one.";

    private final PasswordResetRepository resets;
    private final CustomerAccountRepository customers;
    private final PasswordEncoder passwordEncoder;
    private final EmailNotifier notifier;
    private final LoginAttemptService loginAttemptService;
    private final int otpMinutes;
    private final int linkMinutes;
    private final int maxAttempts;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(PasswordResetRepository resets, CustomerAccountRepository customers,
                                PasswordEncoder passwordEncoder, EmailNotifier notifier, LoginAttemptService loginAttemptService,
                                @Value("${app.password-reset.otp-minutes:10}") int otpMinutes,
                                @Value("${app.password-reset.link-minutes:30}") int linkMinutes,
                                @Value("${app.password-reset.max-attempts:5}") int maxAttempts) {
        this.resets = resets;
        this.customers = customers;
        this.passwordEncoder = passwordEncoder;
        this.notifier = notifier;
        this.loginAttemptService = loginAttemptService;
        this.otpMinutes = otpMinutes;
        this.linkMinutes = linkMinutes;
        this.maxAttempts = maxAttempts;
    }

    /** Step 1: email an OTP + reset link. Silently does nothing for an unknown / blocked email or too many requests. */
    @Transactional
    public void requestReset(String rawEmail) {
        String email = normalise(rawEmail);
        Optional<CustomerAccount> found = customers.findByEmailIgnoreCase(email);
        if (found.isEmpty() || !Boolean.TRUE.equals(found.get().getActive())) {
            log.info("Password reset asked for an email without an active account ({})", EmailService.mask(email));
            return;
        }
        CustomerAccount c = found.get();
        LocalDateTime now = LocalDateTime.now();
        List<PasswordReset> lastHour = resets.findByCustomerIdAndCreatedAtAfterOrderByCreatedAtDesc(c.getId(), now.minusHours(1));
        if (lastHour.size() >= MAX_PER_HOUR
                || (!lastHour.isEmpty() && lastHour.get(0).getCreatedAt().isAfter(now.minusSeconds(COOLDOWN_SECONDS)))) {
            log.info("Password reset for customer {} not sent: asked too often", c.getId());
            return;
        }
        // older requests stop working: only the newest email is valid
        for (PasswordReset old : resets.findByCustomerIdAndClosedAtIsNull(c.getId())) {
            old.close(PasswordReset.CloseReason.REPLACED);
        }
        String otp = String.format("%06d", random.nextInt(1_000_000));
        byte[] raw = new byte[32];
        random.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        resets.save(PasswordReset.builder()
                .customerId(c.getId())
                .otpHash(passwordEncoder.encode(otp))
                .otpExpiresAt(now.plusMinutes(otpMinutes))
                .tokenHash(sha256(token))
                .tokenExpiresAt(now.plusMinutes(linkMinutes))
                .build());
        notifier.passwordReset(c, otp, token, otpMinutes, linkMinutes);
    }

    /**
     * Step 2a: email + OTP + new password. A wrong code counts as one try (kept even though the call fails);
     * after the last try the request is closed.
     */
    @Transactional(noRollbackFor = BadRequestException.class)
    public void resetWithOtp(String rawEmail, String otp, String newPassword) {
        CustomerAccount c = customers.findByEmailIgnoreCase(normalise(rawEmail))
                .filter(x -> Boolean.TRUE.equals(x.getActive()))
                .orElseThrow(() -> new BadRequestException(BAD_CODE));
        PasswordReset r = resets.findFirstByCustomerIdAndClosedAtIsNullOrderByCreatedAtDesc(c.getId())
                .orElseThrow(() -> new BadRequestException(BAD_CODE));
        if (LocalDateTime.now().isAfter(r.getOtpExpiresAt())) {
            throw new BadRequestException(BAD_CODE);
        }
        String code = otp == null ? "" : otp.trim();
        if (!code.matches("[0-9]{6}") || !passwordEncoder.matches(code, r.getOtpHash())) {
            r.setAttempts(r.getAttempts() + 1);
            if (r.getAttempts() >= maxAttempts) {
                r.close(PasswordReset.CloseReason.TOO_MANY_ATTEMPTS);
                resets.save(r);
                throw new BadRequestException("Too many wrong codes. Please ask for a new one.");
            }
            resets.save(r);
            throw new BadRequestException("Wrong code. " + (maxAttempts - r.getAttempts()) + " attempt(s) left.");
        }
        finish(c, r, newPassword);
    }

    /** Step 2b: the token from the reset link + new password. */
    @Transactional
    public void resetWithToken(String token, String newPassword) {
        PasswordReset r = openByToken(token).orElseThrow(() -> new BadRequestException(BAD_LINK));
        CustomerAccount c = customers.findById(r.getCustomerId())
                .filter(x -> Boolean.TRUE.equals(x.getActive()))
                .orElseThrow(() -> new BadRequestException(BAD_LINK));
        finish(c, r, newPassword);
    }

    /** For the reset page: can this link still be used? (Changes nothing.) */
    @Transactional(readOnly = true)
    public boolean linkValid(String token) {
        return openByToken(token).isPresent();
    }

    private Optional<PasswordReset> openByToken(String token) {
        if (token == null || token.isBlank() || token.length() > 100) {
            return Optional.empty();
        }
        return resets.findByTokenHash(sha256(token.trim()))
                .filter(PasswordReset::isOpen)
                .filter(r -> LocalDateTime.now().isBefore(r.getTokenExpiresAt()));
    }

    private void finish(CustomerAccount c, PasswordReset used, String newPassword) {
        if (newPassword == null || newPassword.length() < 8 || newPassword.length() > 100) {
            throw new BadRequestException("Password must be at least 8 characters");
        }
        c.setPasswordHash(passwordEncoder.encode(newPassword));
        customers.save(c);
        used.close(PasswordReset.CloseReason.USED);
        resets.save(used);
        for (PasswordReset other : resets.findByCustomerIdAndClosedAtIsNull(c.getId())) {
            other.close(PasswordReset.CloseReason.REPLACED);
        }
        // a locked-out customer can log in with the new password straight away
        loginAttemptService.recordSuccess("customer:" + c.getEmail().toLowerCase(Locale.ROOT));
        loginAttemptService.recordSuccess("customer:" + c.getPhone());
        log.info("Password reset for customer {}", c.getId());
    }

    /** Old requests are deleted after a week (every night at 3 am). */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanUp() {
        int n = resets.deleteOlderThan(LocalDateTime.now().minusDays(7));
        if (n > 0) {
            log.info("Deleted {} old password reset request(s)", n);
        }
    }

    private static String normalise(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    static String sha256(String s) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}

package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.CustomerLoginRequest;
import com.hotelshivar.backend.dto.CustomerRegisterRequest;
import com.hotelshivar.backend.dto.OtpRequest;
import com.hotelshivar.backend.entity.Booking;
import com.hotelshivar.backend.entity.CustomerAccount;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.exception.UnauthorizedException;
import com.hotelshivar.backend.repository.BookingRepository;
import com.hotelshivar.backend.repository.CustomerAccountRepository;
import com.hotelshivar.backend.repository.FoodOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/** Customer accounts on the website: sign up, log in, and see / add their own bookings and online orders. */
@Service
@RequiredArgsConstructor
public class CustomerService {

    private static final String BAD_LOGIN = "Wrong email / mobile number or password";

    private final CustomerAccountRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final LoginAttemptService loginAttemptService;
    private final BookingRepository bookingRepository;
    private final FoodOrderRepository orderRepository;
    private final OtpService otpService;
    private final EmailNotifier emailNotifier;

    public record Session(String token, CustomerAccount customer, long expiresAt) { }

    @Transactional
    public Session register(CustomerRegisterRequest r) {
        String email = r.getEmail().trim().toLowerCase(Locale.ROOT);
        if (repository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BadRequestException("An account with this email already exists - please log in");
        }
        if (repository.findFirstByPhone(r.getPhone()).isPresent()) {
            throw new BadRequestException("An account with this mobile number already exists - please log in");
        }
        CustomerAccount c = repository.save(CustomerAccount.builder()
                .name(r.getName().trim())
                .email(email)
                .phone(r.getPhone())
                .passwordHash(passwordEncoder.encode(r.getPassword()))
                .lastLoginAt(LocalDateTime.now())
                .build());
        emailNotifier.welcome(c); // sent after the account is saved
        return session(c);
    }

    @Transactional
    public Session login(CustomerLoginRequest r) {
        String login = r.getLogin().trim();
        String key = "customer:" + login.toLowerCase(Locale.ROOT);
        if (loginAttemptService.isLocked(key)) {
            throw new UnauthorizedException("Too many failed attempts. Try again in 15 minutes.");
        }
        Optional<CustomerAccount> found = login.matches("[0-9]{10}")
                ? repository.findFirstByPhone(login) : repository.findByEmailIgnoreCase(login);
        boolean ok = found.isPresent() && Boolean.TRUE.equals(found.get().getActive())
                && passwordEncoder.matches(r.getPassword(), found.get().getPasswordHash());
        if (!ok) {
            loginAttemptService.recordFailure(key);
            throw new UnauthorizedException(BAD_LOGIN);
        }
        loginAttemptService.recordSuccess(key);
        CustomerAccount c = found.get();
        c.setLastLoginAt(LocalDateTime.now());
        repository.save(c);
        return session(c);
    }

    /** OTP login step 1: send a code to this number. newUser = no account yet (the next step asks name + email). */
    public record OtpSent(boolean newUser, int resendIn, String code) { }

    public OtpSent sendOtp(String phone) {
        Optional<CustomerAccount> existing = repository.findFirstByPhone(phone);
        if (existing.isPresent() && !Boolean.TRUE.equals(existing.get().getActive())) {
            throw new UnauthorizedException("This account is blocked. Please call the hotel.");
        }
        String code = otpService.send(phone);
        return new OtpSent(existing.isEmpty(), OtpService.RESEND_SECONDS, code);
    }

    /**
     * OTP login step 2: a correct code logs the customer in. For a new number the account is created here,
     * so name and email are needed (the email also lets them log in with a password later, if they set one).
     */
    @Transactional
    public Session loginWithOtp(OtpRequest r) {
        String phone = r.getPhone();
        Optional<CustomerAccount> existing = repository.findFirstByPhone(phone);
        String email = r.getEmail() == null ? "" : r.getEmail().trim().toLowerCase(Locale.ROOT);
        if (existing.isEmpty()) {
            // check the details before using up the OTP, so a typo does not need a new code
            if (r.getName() == null || r.getName().isBlank()) {
                throw new BadRequestException("Enter your full name");
            }
            if (email.isEmpty()) {
                throw new BadRequestException("Enter your email");
            }
            if (repository.findByEmailIgnoreCase(email).isPresent()) {
                throw new BadRequestException("This email is already used by another account - log in with that account's mobile number");
            }
        }
        otpService.verify(phone, r.getOtp());
        CustomerAccount c = existing.orElseGet(() -> CustomerAccount.builder()
                .name(r.getName())
                .email(email)
                .phone(phone)
                // OTP-only account: a random password nobody knows (password login stays off until one is set)
                .passwordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                .build());
        if (!Boolean.TRUE.equals(c.getActive())) {
            throw new UnauthorizedException("This account is blocked. Please call the hotel.");
        }
        c.setLastLoginAt(LocalDateTime.now());
        CustomerAccount saved = repository.save(c);
        if (existing.isEmpty()) {
            emailNotifier.welcome(saved); // new account made with the mobile OTP
        }
        return session(saved);
    }

    private Session session(CustomerAccount c) {
        long exp = tokenService.customerExpiryFromNow();
        return new Session(tokenService.createCustomerToken(c, exp), c, exp);
    }

    public List<Booking> bookings(CustomerAccount c) {
        return bookingRepository.findByCustomerIdOrderByCreatedAtDesc(c.getId());
    }

    public List<FoodOrder> orders(CustomerAccount c) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(c.getId());
    }

    /**
     * Adds a booking or order made as a guest to this account, using the secret code from its
     * confirmation / tracking link (BK... for bookings, HS... for orders).
     */
    @Transactional
    public Map<String, Object> claim(CustomerAccount c, String rawCode) {
        String code = rawCode == null ? "" : rawCode.trim();
        int slash = code.lastIndexOf('/');
        if (slash >= 0) {
            code = code.substring(slash + 1); // a whole link was pasted
        }
        Optional<Booking> b = bookingRepository.findByTrackingCode(code);
        if (b.isPresent()) {
            Booking booking = b.get();
            requireFree(booking.getCustomerId(), c);
            booking.setCustomerId(c.getId());
            bookingRepository.save(booking);
            return Map.of("type", "BOOKING", "id", booking.getId());
        }
        Optional<FoodOrder> o = orderRepository.findByTrackingCode(code);
        if (o.isPresent()) {
            FoodOrder order = o.get();
            requireFree(order.getCustomerId(), c);
            order.setCustomerId(c.getId());
            orderRepository.save(order);
            return Map.of("type", "ORDER", "id", order.getId());
        }
        throw new ResourceNotFoundException("No booking or order found for this code. Check the link in your confirmation.");
    }

    private static void requireFree(Long owner, CustomerAccount c) {
        if (owner != null && !owner.equals(c.getId())) {
            throw new BadRequestException("This is already linked to another account");
        }
    }
}

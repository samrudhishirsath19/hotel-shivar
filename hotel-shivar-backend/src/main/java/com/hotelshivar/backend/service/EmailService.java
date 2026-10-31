package com.hotelshivar.backend.service;

import com.hotelshivar.backend.config.AsyncConfig;
import com.hotelshivar.backend.dto.EmailDetails;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;

/**
 * Sends the guest emails (HTML, Thymeleaf templates in resources/templates/email). One method per email.
 * Every send method runs in the background (@Async on the mail thread pool) and never throws: a failed email
 * is logged and the booking / order / payment it belongs to is not affected.
 * Without MAIL_USERNAME (no SMTP account set) emails are only logged.
 */
@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final ITemplateEngine templates;
    private final String from;
    private final String smtpUser;
    private final String hotelName;
    private final String siteUrl;

    public EmailService(JavaMailSender mailSender, ITemplateEngine templates,
                        @Value("${app.mail.from:}") String from,
                        @Value("${spring.mail.username:}") String smtpUser,
                        @Value("${app.mail.hotel-name:Hotel Shivar}") String hotelName,
                        @Value("${app.frontend-url:http://localhost:5173}") String siteUrl) {
        this.mailSender = mailSender;
        this.templates = templates;
        this.from = from == null || from.isBlank() ? smtpUser : from.trim();
        this.smtpUser = smtpUser == null ? "" : smtpUser.trim();
        this.hotelName = hotelName;
        this.siteUrl = siteUrl.replaceAll("/+$", "");
    }

    /** Is an SMTP account set (MAIL_USERNAME)? If not, emails are only written to the log. */
    public boolean enabled() {
        return !smtpUser.isEmpty();
    }

    public String siteUrl() {
        return siteUrl;
    }

    // ------------------------------------------------------------------ one method per email

    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendWelcomeEmail(String to, String name) {
        send(to, "Welcome to " + hotelName, "email/welcome", Map.of(
                "name", name,
                "accountLink", siteUrl + "/account"));
    }

    /** Forgot password: the 6-digit OTP and, as an alternative, a one-time reset link. */
    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendPasswordResetEmail(String to, String name, String otp, String resetLink, int otpMinutes, int linkMinutes) {
        send(to, otp + " is your " + hotelName + " password reset code", "email/password-reset", Map.of(
                "name", name,
                "otp", otp,
                "resetLink", resetLink,
                "otpMinutes", otpMinutes,
                "linkMinutes", linkMinutes));
    }

    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendBookingConfirmation(EmailDetails.Booking b) {
        send(b.to(), "Booking confirmation #" + b.bookingId() + " - " + hotelName, "email/booking-confirmation", Map.of("b", b));
    }

    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendOrderConfirmation(EmailDetails.Order o) {
        send(o.to(), "Order confirmation #" + o.orderId() + " - " + hotelName, "email/order-confirmation", Map.of("o", o));
    }

    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendPaymentReceipt(EmailDetails.Receipt r) {
        send(r.to(), "Payment receipt for order #" + r.orderId() + " - " + hotelName, "email/payment-receipt", Map.of("r", r));
    }

    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendCancellationConfirmation(EmailDetails.Cancellation c) {
        send(c.to(), c.kind() + " #" + c.id() + " cancelled - " + hotelName, "email/cancellation", Map.of("c", c));
    }

    /**
     * Super admin "send a test email" (not in the background, so the result can be shown):
     * returns null when it was sent, otherwise the reason it failed.
     */
    public String sendTestEmail(String to) {
        if (!enabled()) {
            return "MAIL_USERNAME is not set - set MAIL_USERNAME and MAIL_PASSWORD and restart the backend";
        }
        try {
            deliver(to, "Test email from " + hotelName, render("email/test", Map.of("sentAt", LocalDateTime.now())));
            return null;
        } catch (Exception e) {
            log.error("Test email to {} failed: {}", mask(to), e.toString());
            return rootCause(e);
        }
    }

    // ------------------------------------------------------------------ sending

    /** Renders and sends one email. Never throws (logged instead). Returns true when it was handed to SMTP. */
    boolean send(String to, String subject, String template, Map<String, Object> vars) {
        if (to == null || to.isBlank()) {
            log.debug("Email '{}' skipped: no email address", subject);
            return false;
        }
        try {
            String html = render(template, vars);
            if (!enabled()) {
                log.info("Email not sent (MAIL_USERNAME not set): '{}' to {}", safeSubject(subject, template), mask(to));
                return false;
            }
            deliver(to, subject, html);
            log.info("Email sent: '{}' to {}", safeSubject(subject, template), mask(to));
            return true;
        } catch (Exception e) {
            log.error("Email '{}' to {} failed: {}", safeSubject(subject, template), mask(to), rootCause(e));
            return false;
        }
    }

    String render(String template, Map<String, Object> vars) {
        Context ctx = new Context(Locale.ENGLISH);
        ctx.setVariables(vars);
        ctx.setVariable("hotelName", hotelName);
        ctx.setVariable("siteUrl", siteUrl);
        ctx.setVariable("year", Year.now().getValue());
        ctx.setVariable("fmt", Format.INSTANCE);
        return templates.process(template, ctx);
    }

    private void deliver(String to, String subject, String html) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());
        helper.setFrom(new InternetAddress(from, hotelName, StandardCharsets.UTF_8.name()));
        helper.setTo(to.trim());
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(message);
    }

    /** The password reset subject starts with the OTP - keep it out of the log. */
    private static String safeSubject(String subject, String template) {
        return "email/password-reset".equals(template) ? "password reset" : subject;
    }

    /** ra***@gmail.com - full addresses are not written to the log. */
    static String mask(String email) {
        if (email == null) {
            return "";
        }
        int at = email.indexOf('@');
        return at <= 0 ? "***" : email.substring(0, Math.min(2, at)) + "***" + email.substring(at);
    }

    private static String rootCause(Throwable e) {
        Throwable t = e;
        while (t.getCause() != null && t.getCause() != t) {
            t = t.getCause();
        }
        return t.getClass().getSimpleName() + ": " + t.getMessage();
    }

    /** Formatting used in the templates: ${fmt.money(x)}, ${fmt.date(d)}, ${fmt.dateTime(t)}. */
    public static final class Format {
        static final Format INSTANCE = new Format();
        private static final Locale INDIA = Locale.forLanguageTag("en-IN");
        private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("EEE, d MMM yyyy", Locale.ENGLISH);
        private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("d MMM yyyy, h:mm a", Locale.ENGLISH);

        public String money(BigDecimal v) {
            return v == null ? "-" : NumberFormat.getCurrencyInstance(INDIA).format(v);
        }

        public String date(LocalDate d) {
            return d == null ? "-" : d.format(DATE);
        }

        public String dateTime(LocalDateTime t) {
            return t == null ? "-" : t.format(DATE_TIME);
        }

        public boolean positive(BigDecimal v) {
            return v != null && v.signum() > 0;
        }
    }
}

package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.EmailDetails;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * EmailService without Spring or a database: the real Thymeleaf templates, a mocked SMTP sender.
 * The last test sends a REAL email and only runs when MAIL_USERNAME, MAIL_PASSWORD and MAIL_TEST_TO are set.
 */
class EmailServiceTest {

    private JavaMailSender sender;
    private EmailService service;

    static SpringTemplateEngine templates() {
        ClassLoaderTemplateResolver r = new ClassLoaderTemplateResolver();
        r.setPrefix("templates/");
        r.setSuffix(".html");
        r.setTemplateMode(TemplateMode.HTML);
        r.setCharacterEncoding("UTF-8");
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(r);
        return engine;
    }

    @BeforeEach
    void setUp() {
        sender = mock(JavaMailSender.class);
        when(sender.createMimeMessage()).thenAnswer(i -> new MimeMessage(Session.getInstance(new Properties())));
        service = new EmailService(sender, templates(), "", "hotel.test@gmail.com", "Hotel Shivar", "http://localhost:5173/");
    }

    private MimeMessage sent() {
        ArgumentCaptor<MimeMessage> c = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender).send(c.capture());
        return c.getValue();
    }

    private static String body(MimeMessage m) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        m.writeTo(out);
        // quoted-printable: undo soft line breaks and =XX escapes enough for text checks
        return out.toString(StandardCharsets.UTF_8).replace("=\r\n", "").replace("=3D", "=");
    }

    @Test
    void bookingConfirmationHasAllDetails() throws Exception {
        service.sendBookingConfirmation(new EmailDetails.Booking("guest@example.com", "Asha Patil", 42L, "Garden Deluxe", "Deluxe",
                LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 7), 2, 3,
                new BigDecimal("6000.00"), "Diwali Special", new BigDecimal("600.00"), new BigDecimal("648.00"),
                new BigDecimal("6048.00"), "Pending", "http://localhost:5173/booking/BKabc"));

        MimeMessage m = sent();
        assertThat(m.getSubject()).isEqualTo("Booking confirmation #42 - Hotel Shivar");
        assertThat(m.getAllRecipients()[0].toString()).isEqualTo("guest@example.com");
        assertThat(m.getFrom()[0].toString()).contains("hotel.test@gmail.com").contains("Hotel Shivar");
        String html = body(m);
        assertThat(html).contains("#<span>42</span>", "Garden Deluxe", "Deluxe", "Thu, 5 Nov 2026", "Sat, 7 Nov 2026",
                ">3<", "Diwali Special", "6,048.00", "/booking/BKabc", "Hotel Shivar");
    }

    @Test
    void everyTemplateRenders() {
        var line = new EmailDetails.Line("Paneer Tikka", 2, new BigDecimal("250"), new BigDecimal("500"));
        String order = service.render("email/order-confirmation", java.util.Map.of("o", new EmailDetails.Order("a@b.com", "Ravi", 7L,
                List.of(line), new BigDecimal("500"), null, null, new BigDecimal("25"), new BigDecimal("525"), "UPI", "Station Road", null)));
        assertThat(order).contains("Paneer Tikka", ">2<", "500.00", "525.00", "#<span>7</span>").doesNotContain("Offer:");

        String receipt = service.render("email/payment-receipt", java.util.Map.of("r", new EmailDetails.Receipt("a@b.com", "Ravi", 7L,
                "pay_ABC123", "UTR998877", new BigDecimal("525"), LocalDateTime.of(2026, 10, 31, 14, 5), "UPI", "SUCCESS", null)));
        assertThat(receipt).contains("pay_ABC123", "UTR998877", "525.00", "31 Oct 2026, 2:05 PM", "UPI", "SUCCESS");

        String refund = service.render("email/cancellation", java.util.Map.of("c", new EmailDetails.Cancellation("a@b.com", "Ravi", "Order", 7L,
                LocalDateTime.now(), new BigDecimal("525"), "rfnd_XYZ", "UPI", "Refunded through Razorpay")));
        assertThat(refund).contains("<span>Order</span> cancelled", "rfnd_XYZ", "525.00", "Refunded through Razorpay");

        String noRefund = service.render("email/cancellation", java.util.Map.of("c", new EmailDetails.Cancellation("a@b.com", "Asha", "Booking", 42L,
                LocalDateTime.now(), null, null, null, null)));
        assertThat(noRefund).contains("<span>Booking</span> cancelled", "nothing to refund");

        String reset = service.render("email/password-reset", java.util.Map.of("name", "Asha", "otp", "482913",
                "resetLink", "http://localhost:5173/reset-password?token=t0k3n", "otpMinutes", 10, "linkMinutes", 30));
        assertThat(reset).contains("482913", "reset-password?token=t0k3n", ">10<", ">30<");

        assertThat(service.render("email/welcome", java.util.Map.of("name", "Asha", "accountLink", "x"))).contains("Welcome, <span>Asha</span>");
    }

    @Test
    void failedSmtpIsLoggedNotThrown() {
        doThrow(new MailSendException("535 Username and Password not accepted")).when(sender).send(any(MimeMessage.class));
        assertThatCode(() -> service.sendWelcomeEmail("guest@example.com", "Asha")).doesNotThrowAnyException();
        assertThat(service.send("guest@example.com", "x", "email/welcome", java.util.Map.of("name", "A", "accountLink", "x"))).isFalse();
    }

    @Test
    void noSmtpAccountMeansNothingIsSent() {
        EmailService off = new EmailService(sender, templates(), "", "", "Hotel Shivar", "http://localhost:5173");
        off.sendWelcomeEmail("guest@example.com", "Asha");
        verify(sender, never()).send(any(MimeMessage.class));
        assertThat(off.sendTestEmail("guest@example.com")).contains("MAIL_USERNAME");
    }

    @Test
    void missingAddressIsSkipped() {
        service.sendWelcomeEmail(null, "Asha");
        verify(sender, never()).send(any(MimeMessage.class));
    }

    /**
     * Real end-to-end send through Gmail SMTP. Run with (PowerShell):
     *   $env:MAIL_USERNAME="you@gmail.com"; $env:MAIL_PASSWORD="your-app-password"; $env:MAIL_TEST_TO="you@gmail.com"
     *   mvn -Dtest=EmailServiceTest#realGmailSmtpSendWorks test
     */
    @Test
    @EnabledIfEnvironmentVariable(named = "MAIL_TEST_TO", matches = ".+@.+")
    void realGmailSmtpSendWorks() {
        JavaMailSenderImpl smtp = new JavaMailSenderImpl();
        smtp.setHost(System.getenv().getOrDefault("MAIL_HOST", "smtp.gmail.com"));
        smtp.setPort(Integer.parseInt(System.getenv().getOrDefault("MAIL_PORT", "587")));
        smtp.setUsername(System.getenv("MAIL_USERNAME"));
        smtp.setPassword(System.getenv("MAIL_PASSWORD"));
        smtp.setDefaultEncoding("UTF-8");
        Properties p = smtp.getJavaMailProperties();
        p.put("mail.smtp.auth", "true");
        p.put("mail.smtp.starttls.enable", "true");
        p.put("mail.smtp.starttls.required", "true");
        p.put("mail.smtp.connectiontimeout", "10000");
        p.put("mail.smtp.timeout", "10000");

        EmailService real = new EmailService(smtp, templates(), "", System.getenv("MAIL_USERNAME"), "Hotel Shivar", "http://localhost:5173");
        String error = real.sendTestEmail(System.getenv("MAIL_TEST_TO"));
        assertThat(error).as("SMTP error").isNull();
    }
}

package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Super admin: send a test email to check the SMTP settings (MAIL_USERNAME / MAIL_PASSWORD). */
@RestController
@RequestMapping("/api/admin/email")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/test")
    public Map<String, Object> test(@RequestBody Map<String, String> body) {
        String to = body.get("to") == null ? "" : body.get("to").trim();
        if (!to.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
            throw new BadRequestException("Enter a valid email address to send the test to");
        }
        String error = emailService.sendTestEmail(to);
        if (error != null) {
            throw new BadRequestException("Test email failed: " + error);
        }
        return Map.of("sent", true, "message", "Test email sent to " + to + ". Check the inbox (and spam).");
    }
}

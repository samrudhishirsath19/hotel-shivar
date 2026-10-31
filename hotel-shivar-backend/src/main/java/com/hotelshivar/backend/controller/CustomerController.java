package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.CustomerLoginRequest;
import com.hotelshivar.backend.dto.CustomerRegisterRequest;
import com.hotelshivar.backend.dto.OtpRequest;
import com.hotelshivar.backend.dto.PasswordResetRequest;
import com.hotelshivar.backend.entity.Booking;
import com.hotelshivar.backend.entity.CustomerAccount;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.security.AuthInterceptor;
import com.hotelshivar.backend.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Website customer accounts (separate from staff logins): sign up, log in, and track own bookings / orders.
 * register and login are public; everything else needs a customer login (see AccessPolicy).
 */
@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final com.hotelshivar.backend.service.PasswordResetService passwordResetService;

    /** Demo mode (no SMS provider yet): the OTP is also returned so it can be shown on screen. Turn off when live. */
    @org.springframework.beans.factory.annotation.Value("${app.otp.show-code:true}")
    private boolean showOtp;

    public record SessionResponse(String token, CustomerAccount customer, long expiresAt) { }

    @PostMapping("/register")
    public ResponseEntity<SessionResponse> register(@Valid @RequestBody CustomerRegisterRequest request) {
        CustomerService.Session s = customerService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new SessionResponse(s.token(), s.customer(), s.expiresAt()));
    }

    /** Mobile number login, step 1: send an OTP. */
    @PostMapping("/otp/send")
    public Map<String, Object> sendOtp(@Valid @RequestBody OtpRequest request) {
        CustomerService.OtpSent s = customerService.sendOtp(request.getPhone());
        Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("sent", true);
        out.put("newUser", s.newUser());
        out.put("resendIn", s.resendIn());
        if (showOtp) {
            out.put("demoOtp", s.code());
        }
        return out;
    }

    /** Mobile number login, step 2: check the OTP (and create the account for a new number). */
    @PostMapping("/otp/verify")
    public SessionResponse verifyOtp(@Valid @RequestBody OtpRequest request) {
        if (request.getOtp() == null || request.getOtp().isBlank()) {
            throw new com.hotelshivar.backend.exception.BadRequestException("Enter the 6-digit OTP");
        }
        CustomerService.Session s = customerService.loginWithOtp(request);
        return new SessionResponse(s.token(), s.customer(), s.expiresAt());
    }

    @PostMapping("/login")
    public SessionResponse login(@Valid @RequestBody CustomerLoginRequest request) {
        CustomerService.Session s = customerService.login(request);
        return new SessionResponse(s.token(), s.customer(), s.expiresAt());
    }

    // ------------------------------------------------------------------ forgot password (public)

    /** Emails a 6-digit OTP and a reset link. Same answer whether or not the email has an account. */
    @PostMapping("/password/forgot")
    public Map<String, Object> forgotPassword(
            @org.springframework.validation.annotation.Validated(PasswordResetRequest.Forgot.class) @RequestBody PasswordResetRequest request) {
        passwordResetService.requestReset(request.getEmail());
        return Map.of("sent", true, "message",
                "If an account exists for this email, we have sent a 6-digit code and a reset link. Check your inbox (and spam).");
    }

    /** New password with the emailed OTP. */
    @PostMapping("/password/reset")
    public Map<String, Object> resetWithOtp(
            @org.springframework.validation.annotation.Validated(PasswordResetRequest.WithOtp.class) @RequestBody PasswordResetRequest request) {
        passwordResetService.resetWithOtp(request.getEmail(), request.getOtp(), request.getNewPassword());
        return Map.of("reset", true, "message", "Password changed. You can now log in with your new password.");
    }

    /** New password with the token from the reset link. */
    @PostMapping("/password/reset-link")
    public Map<String, Object> resetWithLink(
            @org.springframework.validation.annotation.Validated(PasswordResetRequest.WithLink.class) @RequestBody PasswordResetRequest request) {
        passwordResetService.resetWithToken(request.getToken(), request.getNewPassword());
        return Map.of("reset", true, "message", "Password changed. You can now log in with your new password.");
    }

    /** Reset page: is the link still valid? (token in the body, so it does not end up in server logs) */
    @PostMapping("/password/reset-link/check")
    public Map<String, Object> checkResetLink(@RequestBody PasswordResetRequest request) {
        return Map.of("valid", passwordResetService.linkValid(request.getToken()));
    }

    @GetMapping("/me")
    public CustomerAccount me(@RequestAttribute(AuthInterceptor.CUSTOMER_ATTRIBUTE) CustomerAccount me) {
        return me;
    }

    @GetMapping("/bookings")
    public List<Booking> bookings(@RequestAttribute(AuthInterceptor.CUSTOMER_ATTRIBUTE) CustomerAccount me) {
        return customerService.bookings(me);
    }

    @GetMapping("/orders")
    public List<FoodOrder> orders(@RequestAttribute(AuthInterceptor.CUSTOMER_ATTRIBUTE) CustomerAccount me) {
        return customerService.orders(me);
    }

    /** Add a guest booking / order to this account with the code (or whole link) from its confirmation. */
    @PostMapping("/claim")
    public Map<String, Object> claim(@RequestBody Map<String, String> body,
                                     @RequestAttribute(AuthInterceptor.CUSTOMER_ATTRIBUTE) CustomerAccount me) {
        return customerService.claim(me, body.get("code"));
    }
}

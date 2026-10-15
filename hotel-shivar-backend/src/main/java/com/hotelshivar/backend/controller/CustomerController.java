package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.CustomerLoginRequest;
import com.hotelshivar.backend.dto.CustomerRegisterRequest;
import com.hotelshivar.backend.dto.OtpRequest;
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

package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.LoginRequest;
import com.hotelshivar.backend.dto.LoginResponse;
import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.security.AuthInterceptor;
import com.hotelshivar.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    public record Me(String email, String name, String role) { }

    private final AuthService authService;

    /** Public: email + password in, token out. Wrong details -> 401. */
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** Protected: tells the frontend who is logged in (current name and department). */
    @GetMapping("/me")
    public Me me(@RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) AdminUser user) {
        return new Me(user.getEmail(), user.getName(), user.getRole());
    }
}

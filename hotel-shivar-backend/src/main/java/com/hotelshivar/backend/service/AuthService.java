package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.LoginRequest;
import com.hotelshivar.backend.dto.LoginResponse;
import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.exception.UnauthorizedException;
import com.hotelshivar.backend.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String BAD_CREDENTIALS = "Invalid email or password";

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final LoginAttemptService loginAttemptService;

    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().trim();

        if (loginAttemptService.isLocked(email)) {
            throw new UnauthorizedException("Too many failed attempts. Try again in 15 minutes.");
        }

        Optional<AdminUser> found = adminUserRepository.findByEmailIgnoreCase(email);
        boolean ok = found.isPresent()
                && Boolean.TRUE.equals(found.get().getActive())
                && passwordEncoder.matches(request.getPassword(), found.get().getPasswordHash());

        if (!ok) {
            loginAttemptService.recordFailure(email);
            throw new UnauthorizedException(BAD_CREDENTIALS);
        }

        loginAttemptService.recordSuccess(email);
        AdminUser user = found.get();
        user.setLastLoginAt(LocalDateTime.now());
        adminUserRepository.save(user);

        long expiresAt = tokenService.expiryFromNow();
        String token = tokenService.createToken(user, expiresAt);
        return new LoginResponse(token, user.getEmail(), user.getName(), user.getRole(), expiresAt);
    }
}

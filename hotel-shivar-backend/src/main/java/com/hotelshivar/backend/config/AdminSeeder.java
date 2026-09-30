package com.hotelshivar.backend.config;

import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the first super admin on startup if none exists yet.
 * Email / password come from application.properties (or ADMIN_EMAIL / ADMIN_PASSWORD env vars).
 * Change the default password before going live.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.name:Super Admin}")
    private String adminName;

    @Override
    public void run(String... args) {
        if (adminUserRepository.findByEmailIgnoreCase(adminEmail).isPresent()) {
            return;
        }
        adminUserRepository.save(AdminUser.builder()
                .email(adminEmail.trim())
                .passwordHash(passwordEncoder.encode(adminPassword))
                .name(adminName)
                .role("SUPER_ADMIN")
                .active(true)
                .build());
        log.info("Super admin created: {}", adminEmail);
    }
}

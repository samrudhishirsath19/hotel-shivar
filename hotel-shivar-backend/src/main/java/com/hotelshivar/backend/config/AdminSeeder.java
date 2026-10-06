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

    /** Ready-made Billing department login. Leave app.billing.email empty to skip creating it. */
    @Value("${app.billing.email:}")
    private String billingEmail;

    @Value("${app.billing.password:}")
    private String billingPassword;

    @Value("${app.billing.name:Billing Desk}")
    private String billingName;

    @Override
    public void run(String... args) {
        seedBilling();
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

    private void seedBilling() {
        if (billingEmail == null || billingEmail.isBlank() || billingPassword == null || billingPassword.isBlank()) {
            return;
        }
        if (adminUserRepository.findByEmailIgnoreCase(billingEmail.trim()).isPresent()) {
            return;
        }
        adminUserRepository.save(AdminUser.builder()
                .email(billingEmail.trim())
                .passwordHash(passwordEncoder.encode(billingPassword))
                .name(billingName)
                .role("BILLING")
                .active(true)
                .build());
        log.info("Billing user created: {}", billingEmail);
    }
}

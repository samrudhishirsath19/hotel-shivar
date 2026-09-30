package com.hotelshivar.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A staff account that can log in to the manager dashboard.
 * Passwords are stored only as BCrypt hashes.
 */
@Entity
@Table(name = "admin_users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    private String name;

    /** SUPER_ADMIN for now; kept as a string so more roles can be added later. */
    @Column(nullable = false)
    private String role;

    @Builder.Default
    private Boolean active = true;

    private LocalDateTime lastLoginAt;
}

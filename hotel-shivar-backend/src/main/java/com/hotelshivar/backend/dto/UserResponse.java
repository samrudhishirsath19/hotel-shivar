package com.hotelshivar.backend.dto;

import com.hotelshivar.backend.entity.AdminUser;

import java.time.LocalDateTime;

/** Never includes the password hash. */
public record UserResponse(Long id, String email, String name, String role, boolean active, LocalDateTime lastLoginAt) {

    public static UserResponse from(AdminUser u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getName(), u.getRole(),
                Boolean.TRUE.equals(u.getActive()), u.getLastLoginAt());
    }
}

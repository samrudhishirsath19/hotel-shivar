package com.hotelshivar.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String email;
    private String name;
    private String role;
    /** Token expiry as epoch milliseconds. */
    private long expiresAt;
}

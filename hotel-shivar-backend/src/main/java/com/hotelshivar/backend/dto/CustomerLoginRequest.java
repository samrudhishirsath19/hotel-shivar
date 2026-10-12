package com.hotelshivar.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomerLoginRequest {

    /** Email or 10-digit mobile number. */
    @NotBlank(message = "Enter your email or mobile number")
    private String login;

    @NotBlank(message = "Password is required")
    private String password;
}

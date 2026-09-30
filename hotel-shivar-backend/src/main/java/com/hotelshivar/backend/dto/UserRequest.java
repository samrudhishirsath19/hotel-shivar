package com.hotelshivar.backend.dto;

import com.hotelshivar.backend.security.Roles;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name is too long")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    private String email;

    /** Required when creating a user; optional when editing (leave empty to keep the old password). */
    @Size(max = 100, message = "Password is too long")
    private String password;

    @NotBlank(message = "Department is required")
    @Pattern(regexp = Roles.PATTERN, message = "Unknown department")
    private String role;

    private Boolean active;
}

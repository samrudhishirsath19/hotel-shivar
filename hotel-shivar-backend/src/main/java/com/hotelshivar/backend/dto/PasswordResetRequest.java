package com.hotelshivar.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Forgot password (email only), reset with OTP (email + otp + newPassword) or with the link (token + newPassword). */
@Data
public class PasswordResetRequest {

    public interface Forgot { }

    public interface WithOtp { }

    public interface WithLink { }

    @NotBlank(message = "Enter your email", groups = {Forgot.class, WithOtp.class})
    @Email(message = "Email must be valid", groups = {Forgot.class, WithOtp.class})
    @Size(max = 150, groups = {Forgot.class, WithOtp.class})
    private String email;

    /** Spaces around a typed / pasted email are removed before checking it. */
    public void setEmail(String v) {
        this.email = v == null ? null : v.trim();
    }

    @NotBlank(message = "Enter the 6-digit code", groups = WithOtp.class)
    private String otp;

    @NotBlank(message = "The reset link is incomplete", groups = WithLink.class)
    private String token;

    @NotBlank(message = "Enter a new password", groups = {WithOtp.class, WithLink.class})
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters", groups = {WithOtp.class, WithLink.class})
    private String newPassword;
}

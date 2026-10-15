package com.hotelshivar.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Customer OTP login. Step 1 (send): phone only. Step 2 (verify): phone + otp, and for a new customer
 * also their name and email (to create the account).
 */
@Data
public class OtpRequest {

    @NotBlank(message = "Enter your mobile number")
    @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Enter a valid 10-digit mobile number")
    private String phone;

    @Pattern(regexp = "^$|^[0-9]{6}$", message = "OTP is 6 digits")
    private String otp;

    @Pattern(regexp = "^$|" + Names.PATTERN, message = Names.MESSAGE)
    private String name;

    @Email(message = "Email must be valid")
    @Size(max = 150, message = "Email is too long")
    private String email;

    public void setName(String v) {
        this.name = Names.clean(v);
    }
}

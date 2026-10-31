package com.hotelshivar.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Create / edit a delivery boy login (Order User). Password: required when creating, empty = keep when editing. */
@Data
public class DeliveryBoyRequest {

    @NotBlank(message = "Name is required")
    @Pattern(regexp = Names.PATTERN, message = Names.MESSAGE)
    private String name;

    @NotBlank(message = "Email is required (it is the login id)")
    @Email(message = "Enter a valid email address")
    @Size(max = 150, message = "Email is too long")
    private String email;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Enter a valid 10-digit mobile number")
    private String phone;

    @Size(max = 100, message = "Password is too long")
    private String password;

    private Boolean active;

    public void setName(String v) {
        this.name = Names.clean(v);
    }
}

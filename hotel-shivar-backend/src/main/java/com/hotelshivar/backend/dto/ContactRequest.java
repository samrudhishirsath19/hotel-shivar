package com.hotelshivar.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ContactRequest {

    @NotBlank(message = "Name is required")
    @Pattern(regexp = Names.PATTERN, message = Names.MESSAGE)
    private String name;

    /** Extra spaces removed before checking (full names with spaces are fine). */
    public void setName(String v) {
        this.name = Names.clean(v);
    }

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @Pattern(regexp = "^$|^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    private String phone;

    private String subject;

    @NotBlank(message = "Message is required")
    private String message;
}

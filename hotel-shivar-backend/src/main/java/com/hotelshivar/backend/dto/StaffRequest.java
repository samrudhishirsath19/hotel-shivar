package com.hotelshivar.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class StaffRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name is too long")
    private String name;

    @NotBlank(message = "Job title is required")
    @Size(max = 100, message = "Job title is too long")
    private String jobTitle;

    @Pattern(regexp = "^$|^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    private String phone;

    private LocalDate joinedOn;

    private Boolean active;
}

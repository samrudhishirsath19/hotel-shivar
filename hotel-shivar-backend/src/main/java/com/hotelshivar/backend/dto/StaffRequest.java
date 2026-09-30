package com.hotelshivar.backend.dto;

import jakarta.validation.constraints.NotBlank;
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

    @Size(max = 20, message = "Phone number is too long")
    private String phone;

    private LocalDate joinedOn;

    private Boolean active;
}

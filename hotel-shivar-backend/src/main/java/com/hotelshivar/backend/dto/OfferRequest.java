package com.hotelshivar.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class OfferRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Integer discountPercent;

    private LocalDate validFrom;

    private LocalDate validTo;

    private String imageUrl;

    private Boolean active;
}

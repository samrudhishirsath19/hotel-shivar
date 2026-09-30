package com.hotelshivar.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class InventoryRequest {

    @NotBlank(message = "Item name is required")
    @Size(max = 150, message = "Item name is too long")
    private String name;

    @NotBlank(message = "Unit is required (for example kg, litre, piece)")
    @Size(max = 30, message = "Unit is too long")
    private String unit;

    @NotNull(message = "Quantity is required")
    @PositiveOrZero(message = "Quantity cannot be negative")
    private BigDecimal quantity;

    @PositiveOrZero(message = "Minimum level cannot be negative")
    private BigDecimal minLevel;
}

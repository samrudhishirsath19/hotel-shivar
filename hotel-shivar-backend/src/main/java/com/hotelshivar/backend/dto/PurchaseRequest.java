package com.hotelshivar.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PurchaseRequest {

    @NotNull(message = "Choose an inventory item")
    private Long inventoryItemId;

    @Size(max = 150, message = "Supplier name is too long")
    private String supplier;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be more than 0")
    private BigDecimal quantity;

    @NotNull(message = "Unit cost is required")
    @PositiveOrZero(message = "Unit cost cannot be negative")
    private BigDecimal unitCost;

    /** Empty = today. */
    private LocalDate purchasedOn;

    @Size(max = 500, message = "Note is too long (max 500 characters)")
    private String note;
}

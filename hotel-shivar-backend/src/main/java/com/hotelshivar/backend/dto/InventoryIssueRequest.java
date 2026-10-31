package com.hotelshivar.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Inventory Out: one item taken out of the store. */
@Data
public class InventoryIssueRequest {

    @NotNull(message = "Choose an inventory item")
    private Long inventoryItemId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be more than 0")
    private BigDecimal quantity;

    /** Empty = today. */
    private LocalDate issuedOn;

    @NotBlank(message = "Enter the name of the person who issued it")
    @Pattern(regexp = Names.PATTERN, message = Names.MESSAGE)
    private String issuedBy;

    @Size(max = 100, message = "'Issued to' is too long")
    private String issuedTo;

    @Size(max = 500, message = "Note is too long (max 500 characters)")
    private String note;

    public void setIssuedBy(String v) {
        this.issuedBy = Names.clean(v);
    }
}

package com.hotelshivar.backend.dto;

import com.hotelshivar.backend.entity.enums.OrderType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Add (+1) or remove (-1) one item on a table's or room's running order. */
@Data
public class AdjustOrderRequest {

    @NotNull(message = "Order type is required")
    private OrderType type;

    /** Table number or room number. */
    @NotBlank(message = "Table or room number is required")
    private String number;

    @NotNull(message = "Menu item is required")
    private Long menuItemId;

    @NotNull(message = "Quantity change is required")
    @Min(value = -50, message = "Quantity change is too large")
    @Max(value = 50, message = "Quantity change is too large")
    private Integer delta;
}

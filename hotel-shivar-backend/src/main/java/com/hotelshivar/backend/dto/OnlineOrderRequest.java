package com.hotelshivar.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class OnlineOrderRequest {

    @NotBlank(message = "Your name is required")
    @Size(max = 100, message = "Name is too long")
    private String customerName;

    @NotBlank(message = "Your mobile number is required")
    @Size(max = 20, message = "Mobile number is too long")
    private String customerPhone;

    @NotEmpty(message = "Cart is empty")
    @Valid
    private List<Item> items;

    @Data
    public static class Item {
        @NotNull(message = "Menu item is required")
        private Long menuItemId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 50, message = "Quantity is too large")
        private Integer quantity;
    }
}

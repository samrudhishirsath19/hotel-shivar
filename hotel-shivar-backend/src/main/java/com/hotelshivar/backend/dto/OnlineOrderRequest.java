package com.hotelshivar.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
    @Pattern(regexp = "^[0-9]{10}$", message = "Mobile number must be exactly 10 digits")
    private String customerPhone;

<<<<<<< HEAD
    @NotBlank(message = "Delivery address is required")
    @Size(min = 10, max = 500, message = "Please enter the full delivery address (house / street / area)")
    private String deliveryAddress;

    @Size(max = 300, message = "Delivery note is too long")
    private String deliveryNote;

    /** Optional when placing: CASH_ON_DELIVERY, or the online method the customer will pay with next. */
    private com.hotelshivar.backend.entity.enums.PaymentMethod paymentMethod;

=======
>>>>>>> origin/sakshi
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

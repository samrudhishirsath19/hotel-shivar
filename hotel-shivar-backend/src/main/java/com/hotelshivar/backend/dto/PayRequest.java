package com.hotelshivar.backend.dto;

import com.hotelshivar.backend.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Customer pays for an online order (or chooses cash on delivery). */
@Data
public class PayRequest {

    @NotNull(message = "Choose a payment method")
    private PaymentMethod method;

    /** For UPI: the customer's UPI id (stored masked). */
    @Size(max = 100, message = "UPI id is too long")
    private String upiId;

    /** Demo gateway only: make this attempt fail, to test the "payment failed" flow. */
    private Boolean simulateFailure;
}

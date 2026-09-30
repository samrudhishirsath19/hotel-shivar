package com.hotelshivar.backend.dto;

import com.hotelshivar.backend.entity.enums.PaymentMethod;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Billing desk: how the guest paid (the body is optional - default cash). */
@Data
public class BillPaymentRequest {

    private PaymentMethod method;

    /** UPI UTR / card slip number / receipt number, if any. */
    @Size(max = 100, message = "Reference is too long")
    private String reference;

    /** Customer name printed on the bill (optional; table / room-service guests have none until billing). */
    @Size(max = 100, message = "Customer name is too long")
    private String customerName;
}

package com.hotelshivar.backend.payment;

import com.hotelshivar.backend.entity.enums.PaymentMethod;

import java.math.BigDecimal;

/**
 * Takes an online payment. The app ships with {@link DemoPaymentGateway}; to go live, add an
 * implementation for a real gateway (Razorpay, PayU, Paytm, ...) and mark it @Primary.
 */
public interface PaymentGateway {

    /** Name stored with each transaction, e.g. "DEMO" or "RAZORPAY". */
    String name();

    Result charge(String orderRef, BigDecimal amount, PaymentMethod method, String payerDetail, boolean forceFailure);

    Result refund(String paymentId, BigDecimal amount);

    /** success, our payment id, the gateway / bank reference and a message for the customer. */
    record Result(boolean success, String paymentId, String transactionRef, String message) { }
}

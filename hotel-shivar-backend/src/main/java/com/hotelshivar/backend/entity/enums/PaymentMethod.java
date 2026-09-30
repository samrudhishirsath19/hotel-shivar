package com.hotelshivar.backend.entity.enums;

public enum PaymentMethod {
    UPI,
    CARD,
    NET_BANKING,
    WALLET,
    /** Online order paid in cash to the delivery person. */
    CASH_ON_DELIVERY,
    /** Paid in cash at the billing desk. */
    CASH;

    /** Methods that go through the payment gateway. */
    public boolean isOnline() {
        return this == UPI || this == CARD || this == NET_BANKING || this == WALLET;
    }
}

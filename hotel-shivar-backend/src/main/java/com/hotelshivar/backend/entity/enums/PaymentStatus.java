package com.hotelshivar.backend.entity.enums;

public enum PaymentStatus {
    /** Not paid yet (also: cash on delivery until the cash is collected). */
    PENDING,
    PAID,
    /** The last payment attempt failed - the customer can try again. */
    FAILED,
    /** The money was given back (a paid order that was cancelled). */
    REFUNDED
}

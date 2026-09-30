package com.hotelshivar.backend.entity.enums;

/** Delivery progress of an online order (Swiggy / Zomato style). */
public enum OnlineOrderStatus {
    PLACED,
    CONFIRMED,
    PREPARING,
    READY,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED
}

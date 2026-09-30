package com.hotelshivar.backend.entity.enums;

public enum OrderStatus {
    /** Online order waiting for the manager to accept. */
    PENDING,
    /** Online order accepted by the manager. */
    ACCEPTED,
    /** Running table / room-service order (table is occupied). */
    OPEN,
    /** Bill paid - this is what counts as a sale. */
    PAID,
    CANCELLED
}

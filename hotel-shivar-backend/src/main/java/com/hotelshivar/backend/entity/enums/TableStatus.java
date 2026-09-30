package com.hotelshivar.backend.entity.enums;

/**
 * Status the super admin sets on a restaurant table. "Occupied" is not stored:
 * a table is occupied while it has a running order.
 */
public enum TableStatus {
    /** Can be used for orders. */
    AVAILABLE,
    /** Kept for a guest; orders can still be taken when they arrive. */
    RESERVED,
    /** Not in use (broken, cleaning, ...); no new orders. */
    OUT_OF_SERVICE
}

package com.hotelshivar.backend.entity.enums;

<<<<<<< HEAD
/**
 * Where a running order is between the kitchen and the bill:
 * PREPARING -> READY (kitchen) -> SENT_TO_BILLING (captain) -> bill paid (Billing).
 * There is no way back from READY to PREPARING; only newly added items start the cycle again.
 */
public enum KitchenStatus {
    /** Being made (also the state again after new items are added). */
    PREPARING,
    /** Made by the kitchen - ready for serving (table / room) or shipping (online). */
    READY,
    /** Served / shipped; the captain has sent it to Billing for payment. */
    SENT_TO_BILLING
=======
/** Where a running order is in the kitchen. */
public enum KitchenStatus {
    /** Being made (also the state again after items are added). */
    PREPARING,
    /** Made and ready to be served. */
    READY
>>>>>>> origin/sakshi
}

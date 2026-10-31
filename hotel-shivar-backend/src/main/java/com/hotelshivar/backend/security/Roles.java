package com.hotelshivar.backend.security;

/** Login roles = departments. SUPER_ADMIN can do everything. */
public final class Roles {
    public static final String SUPER_ADMIN = "SUPER_ADMIN";
    public static final String MANAGER = "MANAGER";
    public static final String RECEPTION = "RECEPTION";
    public static final String RESTAURANT = "RESTAURANT";
    public static final String KITCHEN = "KITCHEN";
    /** Billing department: takes payment for orders sent to Billing, prints bills, sees paid bills. */
    public static final String BILLING = "BILLING";
    /** Order User: online orders - assigns them to delivery boys and tracks delivery; delivery boy logins (Module Access). */
    public static final String ORDER_USER = "ORDER_USER";
    /** Delivery boy: only his own assigned orders (accept, pick up, deliver). Fixed access, not on Module Access. */
    public static final String DELIVERY_BOY = "DELIVERY_BOY";

    /** Used in @Pattern validation. */
    public static final String PATTERN = "SUPER_ADMIN|MANAGER|RECEPTION|RESTAURANT|KITCHEN|BILLING|ORDER_USER|DELIVERY_BOY";

    private Roles() { }
}

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

    /** Used in @Pattern validation. */
    public static final String PATTERN = "SUPER_ADMIN|MANAGER|RECEPTION|RESTAURANT|KITCHEN|BILLING";

    private Roles() { }
}

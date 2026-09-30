package com.hotelshivar.backend.security;

/** Login roles = departments. SUPER_ADMIN can do everything. */
public final class Roles {
    public static final String SUPER_ADMIN = "SUPER_ADMIN";
    public static final String MANAGER = "MANAGER";
    public static final String RECEPTION = "RECEPTION";
    public static final String RESTAURANT = "RESTAURANT";
    public static final String KITCHEN = "KITCHEN";

    /** Used in @Pattern validation. */
    public static final String PATTERN = "SUPER_ADMIN|MANAGER|RECEPTION|RESTAURANT|KITCHEN";

    private Roles() { }
}

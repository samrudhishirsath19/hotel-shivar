package com.hotelshivar.backend.entity.enums;

import com.hotelshivar.backend.security.Roles;

import java.util.List;

/**
 * Modules the super admin can grant to / take away from each department (Module Access page).
 * The default departments are the ones that had the module before module access existed.
 * Users and Module Access itself always stay super admin only.
 */
public enum AppModule {

    ROOM_BOOKING("Room Booking", "Reservations: booking list, new bookings, confirm / cancel, room invoices",
            List.of(Roles.RECEPTION)),
    RECEPTION("Reception (Front Desk)", "Rooms set-up: add / edit rooms, room photos and availability; guest enquiries",
            List.of()),
    RESTAURANT("Restaurant", "KOT, table / room-service / online orders, tables and order taking",
            List.of(Roles.MANAGER, Roles.RESTAURANT, Roles.KITCHEN)),
    BILLING("Billing", "Take payment for bills sent to billing, print bills, paid bills",
            List.of(Roles.BILLING)),
    INVENTORY("Inventory", "Stock in hand: add / edit items, low-stock levels",
            List.of(Roles.MANAGER)),
    PURCHASE("Purchase", "Record purchases (stock goes up) and see purchase history",
            List.of()),
    STAFF("Staff Management", "Staff list: add / edit / remove staff members",
            List.of()),
    REPORTS("Reports", "Sales report: day-wise food and room sales, GST collected",
            List.of()),
    SETTINGS("Settings", "GST settings: rates, GSTIN and invoice details",
            List.of());

    private final String label;
    private final String description;
    private final List<String> defaultRoles;

    AppModule(String label, String description, List<String> defaultRoles) {
        this.label = label;
        this.description = description;
        this.defaultRoles = defaultRoles;
    }

    public String label() { return label; }
    public String description() { return description; }
    public List<String> defaultRoles() { return defaultRoles; }
}

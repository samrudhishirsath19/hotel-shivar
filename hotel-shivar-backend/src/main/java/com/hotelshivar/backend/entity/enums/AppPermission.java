package com.hotelshivar.backend.entity.enums;

import com.hotelshivar.backend.security.Roles;

import java.util.Set;

/**
 * One switch on the Module Access page: a sub-module / action inside a module.
 * The super admin turns each one on or off per department (saved in staff_permissions).
 * <p>
 * Starting value for a department (first start after this was added, or a new install):
 * on when the department had the whole module ({@link AppModule}), except the departments in {@code notFor}
 * (the fixed duties that existed before: e.g. only the kitchen marked food ready) and except
 * {@code startOff} permissions, which only the super admin had before.
 */
public enum AppPermission {

    // ---- Room Booking
    BOOKING_VIEW(AppModule.ROOM_BOOKING, "View bookings", "Reservation page: booking list and room invoices"),
    BOOKING_STATUS(AppModule.ROOM_BOOKING, "Confirm / complete / cancel bookings", "Change the status of a booking"),

    // ---- Reception (front desk)
    ROOMS_SETUP(AppModule.RECEPTION, "Rooms set-up", "Add / edit / delete rooms and room photos"),
    ENQUIRIES(AppModule.RECEPTION, "Guest enquiries", "Enquiries page: contact and banquet enquiries from the website"),

    // ---- Restaurant
    TABLE_VIEW(AppModule.RESTAURANT, "Restaurant tables", "Tables page: which tables are free / occupied and their orders",
            Set.of(Roles.KITCHEN), false),
    TABLE_STATUS(AppModule.RESTAURANT, "Table status", "Change a table's status: available / reserved / out of service",
            Set.of(), true),
    TABLE_SETUP(AppModule.RESTAURANT, "Tables set-up", "Add / edit / delete tables (number, seats)",
            Set.of(), true),
    ORDER_TAKING(AppModule.RESTAURANT, "Order taking", "Menu page and “New order”: add items to table / room-service orders",
            Set.of(Roles.KITCHEN), false),
    KOT_VIEW(AppModule.RESTAURANT, "KOT", "KOT page: kitchen order tickets being prepared / ready"),
    KOT_READY(AppModule.RESTAURANT, "Mark food ready", "Kitchen: mark an order ready to serve / ship",
            Set.of(Roles.MANAGER, Roles.RECEPTION, Roles.RESTAURANT, Roles.BILLING), false),
    SEND_TO_BILLING(AppModule.RESTAURANT, "Send to billing", "“Ready to Billing” after the meal is served",
            Set.of(Roles.KITCHEN), false),
    ORDER_CANCEL(AppModule.RESTAURANT, "Cancel orders", "Cancel table / room-service / online orders (paid ones are refunded)",
            Set.of(Roles.KITCHEN), false),
    ONLINE_VIEW(AppModule.RESTAURANT, "Online orders", "Online Orders page: delivery orders, customer and payment details"),
    ONLINE_MANAGE(AppModule.RESTAURANT, "Manage online orders", "Confirm online orders and move them to the next delivery step",
            Set.of(Roles.KITCHEN), false),

    // ---- Billing
    BILLING_VIEW(AppModule.BILLING, "Billing", "Billing page: bills sent to billing and paid bills, print bills"),
    BILLING_PAY(AppModule.BILLING, "Take payment", "Mark bills paid (cash / UPI / card ...)"),
    BILLING_DISCOUNT(AppModule.BILLING, "Give discount", "Give a discount % on a restaurant bill before it is printed (offers or any %)"),

    // ---- Inventory
    INVENTORY_VIEW(AppModule.INVENTORY, "View stock", "Inventory page: stock in hand and low-stock items"),
    INVENTORY_MANAGE(AppModule.INVENTORY, "Manage stock", "Add / edit / delete inventory items"),
    INVENTORY_OUT(AppModule.INVENTORY, "Inventory Out", "Record stock issued from the store (item, quantity, date, issued by)"),

    // ---- Purchase
    PURCHASE_VIEW(AppModule.PURCHASE, "View purchases", "Purchase page: purchase history"),
    PURCHASE_CREATE(AppModule.PURCHASE, "Record purchases", "Record / delete purchases (stock goes up / down)"),

    // ---- Staff
    STAFF_VIEW(AppModule.STAFF, "View staff", "Staff page: staff list"),
    STAFF_MANAGE(AppModule.STAFF, "Manage staff", "Add / edit / remove staff members"),

    // ---- Reports
    SALES_REPORT(AppModule.REPORTS, "Sales report", "Day-wise food and room sales, GST collected"),

    // ---- Settings
    GST_SETTINGS(AppModule.SETTINGS, "GST settings", "GST rates, GSTIN and invoice details"),

    // ---- Offers
    OFFERS_MANAGE(AppModule.OFFERS, "Manage offers", "Add / edit offers: code, discount, valid dates, where they apply"),

    // ---- Delivery
    DELIVERY_ASSIGN(AppModule.DELIVERY, "Assign delivery boy", "Give each online order to a delivery boy (or reassign it before pick-up)"),
    DELIVERY_DISPATCH(AppModule.DELIVERY, "Delivery Dispatch", "Delivery Dispatch page: see Ready orders, choose the delivery boy and dispatch them"),
    DELIVERY_STAFF(AppModule.DELIVERY, "Manage delivery boys", "Create / edit / switch off delivery boy logins");

    /** What a new Order User starts with: online orders, delivery boys (the super admin can change it on Module Access). */
    public static final Set<AppPermission> ORDER_USER_START = java.util.EnumSet.of(
            ONLINE_VIEW, ORDER_CANCEL, DELIVERY_ASSIGN, DELIVERY_DISPATCH, DELIVERY_STAFF);

    /**
     * Kept only so rows saved earlier can still be read: these are now fixed duties of the Kitchen department
     * (confirm online orders on the KOT, mark food Ready) and are not shown on Module Access.
     */
    public static final Set<AppPermission> RETIRED = java.util.EnumSet.of(KOT_READY, ONLINE_MANAGE);

    public boolean retired() { return RETIRED.contains(this); }

    private final AppModule module;
    private final String label;
    private final String description;
    private final Set<String> notFor;
    private final boolean startOff;

    AppPermission(AppModule module, String label, String description) {
        this(module, label, description, Set.of(), false);
    }

    AppPermission(AppModule module, String label, String description, Set<String> notFor, boolean startOff) {
        this.module = module;
        this.label = label;
        this.description = description;
        this.notFor = notFor;
        this.startOff = startOff;
    }

    public AppModule module() { return module; }
    public String label() { return label; }
    public String description() { return description; }

    /** Starting value for a department that has (true) / does not have (false) the whole module. */
    public boolean startsOn(String role, boolean hasModule) {
        return hasModule && !startOff && !notFor.contains(role);
    }
}

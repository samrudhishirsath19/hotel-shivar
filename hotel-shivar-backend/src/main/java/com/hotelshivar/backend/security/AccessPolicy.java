package com.hotelshivar.backend.security;

<<<<<<< HEAD
import com.hotelshivar.backend.entity.enums.AppPermission;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Set;
import java.util.function.BiPredicate;
import java.util.function.Function;

import static com.hotelshivar.backend.entity.enums.AppPermission.*;
=======
import org.springframework.stereotype.Component;

import java.util.Set;
>>>>>>> origin/sakshi

/**
 * One place that says who may call what. Anything not listed here is SUPER_ADMIN only,
 * so a forgotten endpoint is locked, not open.
<<<<<<< HEAD
 * <p>
 * Staff endpoints need a permission (sub-module / action). Which department has which permission is set by
 * the super admin on the Module Access page (saved in the staff_permissions table), so a switched-off feature
 * cannot be reached through its address or API either. The super admin may always do everything.
=======
>>>>>>> origin/sakshi
 */
@Component
public class AccessPolicy {

    private static final Set<String> SUPER = Set.of(Roles.SUPER_ADMIN);
<<<<<<< HEAD
    private static final Set<String> ALL_STAFF = Set.of(Roles.SUPER_ADMIN, Roles.MANAGER, Roles.RECEPTION,
            Roles.RESTAURANT, Roles.KITCHEN, Roles.BILLING);

    /** What a URL needs: public, a fixed list of roles, or any one of these permissions. */
    public record Rule(boolean open, Set<String> roles, Set<AppPermission> permissions) {

        static Rule publicUrl() { return new Rule(true, null, null); }
        static Rule roles(Set<String> roles) { return new Rule(false, roles, null); }
        static Rule any(AppPermission first, AppPermission... more) { return new Rule(false, null, EnumSet.of(first, more)); }

        /** has(role, permission) answers from the Module Access settings. */
        public boolean allows(String role, BiPredicate<String, AppPermission> has) {
            if (open || Roles.SUPER_ADMIN.equals(role)) {
                return true;
            }
            if (roles != null) {
                return roles.contains(role);
            }
            return permissions.stream().anyMatch(p -> has.test(role, p));
        }
    }

    /**
     * param = reads a request parameter the same way the controllers do (query string or form body);
     * used where one endpoint does different things depending on a parameter.
     */
    public Rule rule(String method, String rawPath, Function<String, String> param) {
=======
    private static final Set<String> MANAGEMENT = Set.of(Roles.SUPER_ADMIN, Roles.MANAGER);
    private static final Set<String> FRONT_DESK = Set.of(Roles.SUPER_ADMIN, Roles.MANAGER, Roles.RECEPTION);
    private static final Set<String> ORDER_EDIT = Set.of(Roles.SUPER_ADMIN, Roles.MANAGER, Roles.RESTAURANT);
    private static final Set<String> ORDER_VIEW = Set.of(Roles.SUPER_ADMIN, Roles.MANAGER, Roles.RESTAURANT, Roles.KITCHEN);
    /** Billing desk: super admin, manager and the billing department. */
    private static final Set<String> BILLING_DESK = Set.of(Roles.SUPER_ADMIN, Roles.MANAGER, Roles.BILLING);
    /** Who may look at the live order board (billing needs it to see which orders were sent to Billing). */
    private static final Set<String> BOARD_VIEW = Set.of(Roles.SUPER_ADMIN, Roles.MANAGER, Roles.RESTAURANT,
            Roles.KITCHEN, Roles.BILLING);
    private static final Set<String> KITCHEN_WORK = Set.of(Roles.SUPER_ADMIN, Roles.MANAGER, Roles.KITCHEN);
    private static final Set<String> ALL_STAFF = Set.of(Roles.SUPER_ADMIN, Roles.MANAGER, Roles.RECEPTION,
            Roles.RESTAURANT, Roles.KITCHEN, Roles.BILLING);

    /** Returns null when the URL is public, otherwise the roles that may use it. */
    public Set<String> requiredRoles(String method, String rawPath) {
>>>>>>> origin/sakshi
        String path = (rawPath.length() > 1 && rawPath.endsWith("/"))
                ? rawPath.substring(0, rawPath.length() - 1) : rawPath;
        boolean get = "GET".equalsIgnoreCase(method);
        boolean post = "POST".equalsIgnoreCase(method);
<<<<<<< HEAD
        boolean patch = "PATCH".equalsIgnoreCase(method);

        if ("OPTIONS".equalsIgnoreCase(method)) return Rule.publicUrl();
        if (post && path.equals("/api/auth/login")) return Rule.publicUrl();
        if (path.equals("/api/auth/me")) return Rule.roles(ALL_STAFF);

        // Public website reads
        if (get && (under(path, "/api/rooms") || under(path, "/api/menu") || under(path, "/api/offers")
                || under(path, "/api/gallery") || path.equals("/api/gst"))) {
            return Rule.publicUrl();
=======

        if ("OPTIONS".equalsIgnoreCase(method)) return null;
        if (post && path.equals("/api/auth/login")) return null;
        if (path.equals("/api/auth/me")) return ALL_STAFF;

        // Public website reads
        if (get && (under(path, "/api/rooms") || under(path, "/api/menu") || under(path, "/api/offers")
                || under(path, "/api/gallery"))) {
            return null;
>>>>>>> origin/sakshi
        }
        // Public customer submissions
        if (post && (path.equals("/api/bookings") || path.equals("/api/contact") || path.equals("/api/banquet")
                || path.equals("/api/orders/online"))) {
<<<<<<< HEAD
            return Rule.publicUrl();
        }
        // Customer pays for / tracks their online order with its secret tracking code
        if (post && path.matches("/api/orders/online/[A-Za-z0-9]+/pay")) return Rule.publicUrl();
        if (get && path.matches("/api/orders/track/[A-Za-z0-9]+")) return Rule.publicUrl();

        // ---- Module Access settings: everyone reads (the screens show only granted parts), super admin changes
        if (under(path, "/api/admin/module-access")) return get ? Rule.roles(ALL_STAFF) : Rule.roles(SUPER);

        // ---- Room Booking
        if (under(path, "/api/bookings")) return get ? Rule.any(BOOKING_VIEW) : Rule.any(BOOKING_STATUS);

        // ---- Reception (front desk)
        if (under(path, "/api/contact") || under(path, "/api/banquet")) return Rule.any(ENQUIRIES);
        if (under(path, "/api/rooms") || under(path, "/api/admin/uploads")) return Rule.any(ROOMS_SETUP);

        // ---- Restaurant: order taking (table / room orders, table list for the order screen)
        if (under(path, "/api/orders")) return Rule.any(ORDER_TAKING);

        // ---- Restaurant: actions on one order
        if (post && path.matches("/api/admin/orders/\\d+/ready")) return Rule.any(KOT_READY);
        if (post && path.matches("/api/admin/orders/\\d+/send-to-billing")) return Rule.any(SEND_TO_BILLING);
        if (post && path.matches("/api/admin/orders/\\d+/cancel")) return Rule.any(ORDER_CANCEL);
        if (post && path.matches("/api/admin/orders/\\d+/accept")) return Rule.any(ONLINE_MANAGE);
        if (post && path.matches("/api/admin/orders/\\d+/paid")) return Rule.any(BILLING_PAY);
        if (get && path.matches("/api/admin/orders/\\d+/payments")) return Rule.any(ONLINE_VIEW, BILLING_VIEW, KOT_VIEW);
        // live board: KOT, tables, online orders and billing all read it
        if (get && path.equals("/api/admin/orders/board")) return Rule.any(KOT_VIEW, TABLE_VIEW, ONLINE_VIEW, BILLING_VIEW);
        if (under(path, "/api/admin/orders")) return Rule.roles(SUPER);

        // ---- Restaurant: online orders (cancelling through the status link needs "Cancel orders")
        if (under(path, "/api/admin/online-orders")) {
            if (get) return Rule.any(ONLINE_VIEW);
            String to = param.apply("to");
            return to != null && to.trim().equalsIgnoreCase("CANCELLED") ? Rule.any(ORDER_CANCEL) : Rule.any(ONLINE_MANAGE);
        }

        // ---- Restaurant: tables
        if (under(path, "/api/admin/tables")) {
            if (get) return Rule.any(TABLE_VIEW, TABLE_STATUS, TABLE_SETUP);
            if (patch && path.matches("/api/admin/tables/\\d+/status")) return Rule.any(TABLE_STATUS, TABLE_SETUP);
            return Rule.any(TABLE_SETUP);
        }

        // ---- Billing
        if (under(path, "/api/admin/billing")) return Rule.any(BILLING_VIEW);

        // ---- Inventory / Purchase (the purchase form needs the list of stock items)
        if (under(path, "/api/admin/inventory")) {
            return get ? Rule.any(INVENTORY_VIEW, INVENTORY_MANAGE, PURCHASE_VIEW, PURCHASE_CREATE) : Rule.any(INVENTORY_MANAGE);
        }
        if (under(path, "/api/admin/purchases")) return get ? Rule.any(PURCHASE_VIEW, PURCHASE_CREATE) : Rule.any(PURCHASE_CREATE);

        // ---- Staff / Reports / Settings
        if (under(path, "/api/admin/staff")) return get ? Rule.any(STAFF_VIEW, STAFF_MANAGE) : Rule.any(STAFF_MANAGE);
        if (under(path, "/api/admin/reports")) return Rule.any(SALES_REPORT);
        if (path.equals("/api/admin/gst")) return Rule.any(GST_SETTINGS);

        // users, menu changes, offers / gallery changes, dashboard summary, anything else
        return Rule.roles(SUPER);
=======
            return null;
        }

        // Taking table / room orders is done from the dashboard, so it needs a login
        if (under(path, "/api/orders")) return ORDER_EDIT;

        if (under(path, "/api/bookings")) return FRONT_DESK;
        if (under(path, "/api/contact") || under(path, "/api/banquet")) return MANAGEMENT;
<<<<<<< Updated upstream
        // kitchen staff may mark an order ready / back to preparing
        if (post && path.matches("/api/admin/orders/\\d+/(ready|preparing)")) return ORDER_VIEW;
        if (under(path, "/api/admin/orders")) return get ? ORDER_VIEW : ORDER_EDIT;
        if (under(path, "/api/admin/billing")) return MANAGEMENT;
=======
        // kitchen marks an order ready; the captain sends it to billing; only billing (management) takes payment
        if (post && path.matches("/api/admin/orders/\\d+/ready")) return KITCHEN_WORK;
        if (post && path.matches("/api/admin/orders/\\d+/paid")) return BILLING_DESK;
        if (under(path, "/api/admin/orders")) return get ? BOARD_VIEW : ORDER_EDIT;
        if (under(path, "/api/admin/billing")) return BILLING_DESK;
        // the manager can see stock and purchases (changing them stays super admin only)
        if (get && (under(path, "/api/admin/inventory") || under(path, "/api/admin/purchases"))) return MANAGEMENT;
>>>>>>> Stashed changes

        // users, menu, rooms, reports, offers/gallery changes, anything else
        return SUPER;
>>>>>>> origin/sakshi
    }

    private static boolean under(String path, String base) {
        return path.equals(base) || path.startsWith(base + "/");
    }
}

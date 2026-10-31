package com.hotelshivar.backend.security;

import com.hotelshivar.backend.entity.enums.AppPermission;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Set;
import java.util.function.BiPredicate;
import java.util.function.Function;

import static com.hotelshivar.backend.entity.enums.AppPermission.*;

/**
 * One place that says who may call what. Anything not listed here is SUPER_ADMIN only,
 * so a forgotten endpoint is locked, not open.
 * <p>
 * Staff endpoints need a permission (sub-module / action). Which department has which permission is set by
 * the super admin on the Module Access page (saved in the staff_permissions table), so a switched-off feature
 * cannot be reached through its address or API either. The super admin may always do everything.
 */
@Component
public class AccessPolicy {

    private static final Set<String> SUPER = Set.of(Roles.SUPER_ADMIN);
    private static final Set<String> ALL_STAFF = Set.of(Roles.SUPER_ADMIN, Roles.MANAGER, Roles.RECEPTION,
            Roles.RESTAURANT, Roles.KITCHEN, Roles.BILLING, Roles.ORDER_USER, Roles.DELIVERY_BOY);
    private static final Set<String> DELIVERY_BOY = Set.of(Roles.DELIVERY_BOY);
    /** Kitchen duties: confirm online orders (from the KOT) and mark food Ready. Nobody else, not even the super admin. */
    private static final Set<String> KITCHEN_ONLY = Set.of(Roles.KITCHEN);

    /**
     * What a URL needs: public, a customer account, a fixed list of staff roles, or any one of these permissions.
     * strict = only the listed roles, not even the super admin (duties that belong to one department only).
     */
    public record Rule(boolean open, boolean customer, Set<String> roles, Set<AppPermission> permissions, boolean strict) {

        static Rule publicUrl() { return new Rule(true, false, null, null, false); }
        static Rule customerAccount() { return new Rule(false, true, null, null, false); }
        /** A logged-in customer, or staff with one of these permissions. */
        static Rule customerOrAny(AppPermission first, AppPermission... more) { return new Rule(false, true, null, EnumSet.of(first, more), false); }
        /** Only these departments - the super admin included only if listed. */
        static Rule onlyRoles(Set<String> roles) { return new Rule(false, false, roles, null, true); }

        /** Staff may also use this customer URL (customerOrAny). */
        public boolean staffToo() { return customer && (permissions != null || roles != null); }
        static Rule roles(Set<String> roles) { return new Rule(false, false, roles, null, false); }
        static Rule any(AppPermission first, AppPermission... more) { return new Rule(false, false, null, EnumSet.of(first, more), false); }

        /** has(role, permission) answers from the Module Access settings. */
        public boolean allows(String role, BiPredicate<String, AppPermission> has) {
            if (customer && !staffToo()) {
                return false; // customer URLs are not for staff logins
            }
            if (strict) {
                return roles.contains(role);
            }
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
        String path = (rawPath.length() > 1 && rawPath.endsWith("/"))
                ? rawPath.substring(0, rawPath.length() - 1) : rawPath;
        boolean get = "GET".equalsIgnoreCase(method);
        boolean post = "POST".equalsIgnoreCase(method);
        boolean patch = "PATCH".equalsIgnoreCase(method);

        if ("OPTIONS".equalsIgnoreCase(method)) return Rule.publicUrl();
        if (post && path.equals("/api/auth/login")) return Rule.publicUrl();
        if (path.equals("/api/auth/me")) return Rule.roles(ALL_STAFF);

        // Public website reads
        if (get && (under(path, "/api/rooms") || under(path, "/api/menu") || under(path, "/api/offers")
                || under(path, "/api/gallery") || path.equals("/api/gst"))) {
            return Rule.publicUrl();
        }
        // Public customer submissions
        if (post && (path.equals("/api/contact") || path.equals("/api/banquet"))) {
            return Rule.publicUrl();
        }
        // Booking a room / ordering food online needs a customer login (front-desk staff can still book for a guest)
        if (post && path.equals("/api/bookings")) return Rule.customerOrAny(BOOKING_STATUS);
        if (post && path.equals("/api/orders/online")) return Rule.customerOrAny(ORDER_TAKING);
        // Customer account on the website (separate from staff logins)
        if (post && (path.equals("/api/customer/register") || path.equals("/api/customer/login")
                || path.equals("/api/customer/otp/send") || path.equals("/api/customer/otp/verify"))) return Rule.publicUrl();
        if (post && under(path, "/api/customer/password")) return Rule.publicUrl(); // forgot / reset password
        if (post && path.equals("/api/admin/email/test")) return Rule.roles(SUPER);
        if (under(path, "/api/customer")) return Rule.customerAccount();
        // Customer tracks a room booking with its secret code
        if (get && path.matches("/api/bookings/track/[A-Za-z0-9]+")) return Rule.publicUrl();

        // Customer pays for / tracks their online order with its secret tracking code
        if (post && path.matches("/api/orders/online/[A-Za-z0-9]+/pay")) return Rule.publicUrl();
        if (post && path.matches("/api/orders/online/[A-Za-z0-9]+/razorpay/(order|verify|failed)")) return Rule.publicUrl();
        // Payment settings for the website (public key only) and the Razorpay webhook (checked by its signature)
        if (get && path.equals("/api/payments/config")) return Rule.publicUrl();
        if (post && path.equals("/api/payments/razorpay/webhook")) return Rule.publicUrl();
        if (get && path.matches("/api/orders/track/[A-Za-z0-9]+")) return Rule.publicUrl();

        // ---- Module Access settings: everyone reads (the screens show only granted parts), super admin changes
        if (under(path, "/api/admin/module-access")) return get ? Rule.roles(ALL_STAFF) : Rule.roles(SUPER);

        // ---- Room Booking
        if (under(path, "/api/bookings")) return get ? Rule.any(BOOKING_VIEW) : Rule.any(BOOKING_STATUS);

        // ---- Reception (front desk)
        if (under(path, "/api/contact") || under(path, "/api/banquet")) return Rule.any(ENQUIRIES);
        if (under(path, "/api/rooms")) return Rule.any(ROOMS_SETUP);
        if (under(path, "/api/admin/uploads")) return Rule.any(ROOMS_SETUP, OFFERS_MANAGE); // room / offer photos

        // ---- Offers (reading is public, above)
        if (under(path, "/api/offers")) return Rule.any(OFFERS_MANAGE);

        // ---- Restaurant: order taking (table / room orders, table list for the order screen)
        if (under(path, "/api/orders")) return Rule.any(ORDER_TAKING);

        // ---- Restaurant: actions on one order
        if (post && path.matches("/api/admin/orders/\\d+/ready")) return Rule.onlyRoles(KITCHEN_ONLY);
        if (post && path.matches("/api/admin/orders/\\d+/send-to-billing")) return Rule.any(SEND_TO_BILLING);
        if (post && path.matches("/api/admin/orders/\\d+/cancel")) return Rule.any(ORDER_CANCEL);
        if (post && path.matches("/api/admin/orders/\\d+/accept")) return Rule.onlyRoles(KITCHEN_ONLY);
        if (post && path.matches("/api/admin/orders/\\d+/paid")) return Rule.any(BILLING_PAY);
        if (post && path.matches("/api/admin/orders/\\d+/offer")) return Rule.any(BILLING_DISCOUNT);
        if (post && path.matches("/api/admin/orders/\\d+/discount")) return Rule.any(BILLING_DISCOUNT);
        if (get && path.matches("/api/admin/orders/\\d+/payments")) return Rule.any(ONLINE_VIEW, BILLING_VIEW, KOT_VIEW);
        // live board: KOT, tables, online orders and billing all read it
        if (get && path.equals("/api/admin/orders/board")) return Rule.any(KOT_VIEW, TABLE_VIEW, ONLINE_VIEW, BILLING_VIEW);
        if (under(path, "/api/admin/orders")) return Rule.roles(SUPER);

        // ---- Delivery: assigning, delivery boy logins, and the delivery boy's own orders
        if (post && path.matches("/api/admin/online-orders/\\d+/assign")) return Rule.any(DELIVERY_ASSIGN);
        if (post && path.matches("/api/admin/online-orders/\\d+/dispatch")) return Rule.any(DELIVERY_DISPATCH);
        if (under(path, "/api/admin/delivery-boys")) return get ? Rule.any(DELIVERY_ASSIGN, DELIVERY_DISPATCH, DELIVERY_STAFF) : Rule.any(DELIVERY_STAFF);
        if (under(path, "/api/delivery")) return Rule.roles(DELIVERY_BOY); // only his own orders (checked in DeliveryService)

        // ---- Restaurant: online orders (cancelling through the status link needs "Cancel orders")
        if (under(path, "/api/admin/online-orders")) {
            if (get) return Rule.any(ONLINE_VIEW, DELIVERY_DISPATCH);
            String to = param.apply("to");
            // confirming / preparing / ready = kitchen only; pick-up and delivery = the assigned delivery boy (DeliveryService)
            return to != null && to.trim().equalsIgnoreCase("CANCELLED") ? Rule.any(ORDER_CANCEL) : Rule.onlyRoles(KITCHEN_ONLY);
        }

        // ---- Restaurant: tables
        if (under(path, "/api/admin/tables")) {
            if (get) return Rule.any(TABLE_VIEW, TABLE_STATUS, TABLE_SETUP);
            if (patch && path.matches("/api/admin/tables/\\d+/status")) return Rule.any(TABLE_STATUS, TABLE_SETUP);
            return Rule.any(TABLE_SETUP);
        }

        // ---- Billing
        if (under(path, "/api/admin/billing")) return Rule.any(BILLING_VIEW);

        // ---- Inventory Out (stock issued from the store)
        if (under(path, "/api/admin/inventory-out")) return get ? Rule.any(INVENTORY_VIEW, INVENTORY_OUT) : Rule.any(INVENTORY_OUT);
        // ---- Inventory / Purchase (the purchase form needs the list of stock items)
        if (under(path, "/api/admin/inventory")) {
            return get ? Rule.any(INVENTORY_VIEW, INVENTORY_MANAGE, INVENTORY_OUT, PURCHASE_VIEW, PURCHASE_CREATE) : Rule.any(INVENTORY_MANAGE);
        }
        if (under(path, "/api/admin/purchases")) return get ? Rule.any(PURCHASE_VIEW, PURCHASE_CREATE) : Rule.any(PURCHASE_CREATE);

        // ---- Staff / Reports / Settings
        if (under(path, "/api/admin/staff")) return get ? Rule.any(STAFF_VIEW, STAFF_MANAGE) : Rule.any(STAFF_MANAGE);
        if (under(path, "/api/admin/reports")) return Rule.any(SALES_REPORT);
        if (path.equals("/api/admin/gst")) return Rule.any(GST_SETTINGS);

        // users, menu changes, offers / gallery changes, dashboard summary, anything else
        return Rule.roles(SUPER);
    }

    private static boolean under(String path, String base) {
        return path.equals(base) || path.startsWith(base + "/");
    }
}

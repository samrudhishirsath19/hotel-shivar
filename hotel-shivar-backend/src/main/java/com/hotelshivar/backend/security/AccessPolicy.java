package com.hotelshivar.backend.security;

import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * One place that says who may call what. Anything not listed here is SUPER_ADMIN only,
 * so a forgotten endpoint is locked, not open.
 */
@Component
public class AccessPolicy {

    private static final Set<String> SUPER = Set.of(Roles.SUPER_ADMIN);
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
        String path = (rawPath.length() > 1 && rawPath.endsWith("/"))
                ? rawPath.substring(0, rawPath.length() - 1) : rawPath;
        boolean get = "GET".equalsIgnoreCase(method);
        boolean post = "POST".equalsIgnoreCase(method);

        if ("OPTIONS".equalsIgnoreCase(method)) return null;
        if (post && path.equals("/api/auth/login")) return null;
        if (path.equals("/api/auth/me")) return ALL_STAFF;

        // Public website reads
        if (get && (under(path, "/api/rooms") || under(path, "/api/menu") || under(path, "/api/offers")
                || under(path, "/api/gallery"))) {
            return null;
        }
        // Public customer submissions
        if (post && (path.equals("/api/bookings") || path.equals("/api/contact") || path.equals("/api/banquet")
                || path.equals("/api/orders/online"))) {
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
    }

    private static boolean under(String path, String base) {
        return path.equals(base) || path.startsWith(base + "/");
    }
}

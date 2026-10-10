package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.BillPaymentRequest;
import com.hotelshivar.backend.dto.OrderBoard;
import com.hotelshivar.backend.dto.TrackResponse;
import jakarta.validation.Valid;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.service.OrderService;
import com.hotelshivar.backend.service.ModuleAccessService;
import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.entity.enums.AppPermission;
import com.hotelshivar.backend.security.AuthInterceptor;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * Manager side: the live board (which tables are occupied, room-service and online orders)
 * and the actions on an order. Who may call what is set in AccessPolicy.
 */
@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class StaffOrderController {

    private final OrderService orderService;
    private final ModuleAccessService moduleAccess;

    /**
     * Live board. KOT and Billing see everything; a department that only has "Restaurant tables" and / or
     * "Online orders" gets only those parts, so the API shows no more than its pages do.
     */
    @GetMapping("/board")
    public OrderBoard board(@RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) AdminUser me) {
        OrderBoard b = orderService.board();
        String role = me.getRole();
        if (moduleAccess.has(role, AppPermission.KOT_VIEW) || moduleAccess.has(role, AppPermission.BILLING_VIEW)) {
            return b;
        }
        boolean tables = moduleAccess.has(role, AppPermission.TABLE_VIEW);
        boolean online = moduleAccess.has(role, AppPermission.ONLINE_VIEW);
        return new OrderBoard(b.tableCount(), tables ? b.tables() : List.of(), List.of(), online ? b.online() : List.of());
    }

    @PostMapping("/{id}/accept")
    public FoodOrder accept(@PathVariable Long id) {
        return orderService.accept(id);
    }

    /** Kitchen: the order has been made -> "Ready for Serving/Shipping". */
    @PostMapping("/{id}/ready")
    public FoodOrder ready(@PathVariable Long id) {
        return orderService.markReady(id);
    }

    /** Captain: order served / shipped -> hand it to Billing. */
    @PostMapping("/{id}/send-to-billing")
    public FoodOrder sendToBilling(@PathVariable Long id) {
        return orderService.sendToBilling(id);
    }

    /** Billing: bill paid. Frees the table / closes the order and counts it as a sale. */
    @PostMapping("/{id}/paid")
    public FoodOrder paid(@PathVariable Long id, @Valid @RequestBody(required = false) BillPaymentRequest payment) {
        return orderService.markPaid(id, payment);
    }

    /** Order with its payment transactions. */
    @GetMapping("/{id}/payments")
    public TrackResponse payments(@PathVariable Long id) {
        return orderService.withPayments(id);
    }

    @PostMapping("/{id}/cancel")
    public FoodOrder cancel(@PathVariable Long id) {
        return orderService.cancel(id);
    }
}

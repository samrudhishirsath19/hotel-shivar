package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.OrderBoard;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.enums.KitchenStatus;
import com.hotelshivar.backend.service.OrderService;
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

    @GetMapping("/board")
    public OrderBoard board() {
        return orderService.board();
    }

    @PostMapping("/{id}/accept")
    public FoodOrder accept(@PathVariable Long id) {
        return orderService.accept(id);
    }

    /** Kitchen: the order has been made. */
    @PostMapping("/{id}/ready")
    public FoodOrder ready(@PathVariable Long id) {
        return orderService.setKitchenStatus(id, KitchenStatus.READY);
    }

    /** Kitchen: back to being made. */
    @PostMapping("/{id}/preparing")
    public FoodOrder preparing(@PathVariable Long id) {
        return orderService.setKitchenStatus(id, KitchenStatus.PREPARING);
    }

    /** Bill paid: frees the table / closes the order and counts it as a sale. */
    @PostMapping("/{id}/paid")
    public FoodOrder paid(@PathVariable Long id) {
        return orderService.markPaid(id);
    }

    @PostMapping("/{id}/cancel")
    public FoodOrder cancel(@PathVariable Long id) {
        return orderService.cancel(id);
    }
}

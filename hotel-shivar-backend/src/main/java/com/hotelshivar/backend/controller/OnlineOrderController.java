package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.TrackResponse;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.enums.OnlineOrderStatus;
import com.hotelshivar.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Staff side of online (delivery) orders: the list and the delivery steps
 * Placed -> Confirmed -> Preparing -> Ready -> Out for delivery -> Delivered. Access: see AccessPolicy.
 */
@RestController
@RequestMapping("/api/admin/online-orders")
@RequiredArgsConstructor
public class OnlineOrderController {

    private final OrderService orderService;

    /** Orders of the last `days` days (default today and yesterday) plus every order still running. */
    @GetMapping
    public List<FoodOrder> list(@RequestParam(defaultValue = "1") int days) {
        return orderService.onlineOrders(days);
    }

    @GetMapping("/{id}")
    public TrackResponse get(@PathVariable Long id) {
        return orderService.withPayments(id);
    }

    /** Move the order to its next delivery step (CONFIRMED needs a paid or cash-on-delivery order). */
    @PostMapping("/{id}/status")
    public FoodOrder status(@PathVariable Long id, @RequestParam OnlineOrderStatus to) {
        return orderService.advanceOnline(id, to);
    }
}

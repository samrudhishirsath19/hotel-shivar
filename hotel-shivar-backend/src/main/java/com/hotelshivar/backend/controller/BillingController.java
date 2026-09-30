package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** Paid bills (newest first). Super admin and manager. With no dates you get today's bills. */
@RestController
@RequestMapping("/api/admin/billing")
@RequiredArgsConstructor
public class BillingController {

    private final OrderService orderService;

    @GetMapping
    public List<FoodOrder> bills(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                 @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return orderService.paidOrders(from, to);
    }
}

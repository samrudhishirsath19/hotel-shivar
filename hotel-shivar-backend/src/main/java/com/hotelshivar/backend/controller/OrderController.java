package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.AdjustOrderRequest;
import com.hotelshivar.backend.dto.OnlineOrderRequest;
<<<<<<< HEAD
import com.hotelshivar.backend.dto.PayRequest;
import com.hotelshivar.backend.dto.TrackResponse;
import com.hotelshivar.backend.entity.RestaurantTable;
=======
>>>>>>> origin/sakshi
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.OrderLine;
import com.hotelshivar.backend.entity.enums.OrderType;
import com.hotelshivar.backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Customer side of ordering (public, see AccessPolicy). */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

<<<<<<< HEAD
    /** Tables staff can take orders for (number, seats, status). */
    @GetMapping("/config")
    public Map<String, Object> config() {
        List<RestaurantTable> tables = orderService.orderableTables();
        return Map.of("tableCount", tables.size(), "tables", tables);
=======
    @GetMapping("/config")
    public Map<String, Integer> config() {
        return Map.of("tableCount", orderService.getTableCount());
>>>>>>> origin/sakshi
    }

    /** What is already ordered for a table (type=TABLE&number=3) or a room (type=ROOM&number=101). */
    @GetMapping("/current")
    public List<OrderLine> current(@RequestParam OrderType type, @RequestParam String number) {
        return orderService.currentLines(type, number);
    }

    /** +1 / -1 of one item on a table's or room's running order. */
    @PostMapping("/adjust")
    public FoodOrder adjust(@Valid @RequestBody AdjustOrderRequest request) {
        return orderService.adjust(request);
    }

    @PostMapping("/online")
    public ResponseEntity<FoodOrder> online(@Valid @RequestBody OnlineOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOnline(request));
    }
<<<<<<< HEAD

    /** Public: the customer pays for their order (identified by its secret tracking code). */
    @PostMapping("/online/{code}/pay")
    public TrackResponse pay(@PathVariable String code, @Valid @RequestBody PayRequest request) {
        return orderService.pay(code, request);
    }

    /** Public: order status and payment for the customer's tracking page. */
    @GetMapping("/track/{code}")
    public TrackResponse track(@PathVariable String code) {
        return orderService.track(code);
    }
=======
>>>>>>> origin/sakshi
}

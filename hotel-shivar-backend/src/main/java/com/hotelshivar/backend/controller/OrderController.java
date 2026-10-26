package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.AdjustOrderRequest;
import com.hotelshivar.backend.dto.OnlineOrderRequest;
import com.hotelshivar.backend.dto.PayRequest;
import com.hotelshivar.backend.dto.TrackResponse;
import com.hotelshivar.backend.entity.RestaurantTable;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.OrderLine;
import com.hotelshivar.backend.entity.enums.OrderType;
import com.hotelshivar.backend.service.OrderService;
import com.hotelshivar.backend.entity.CustomerAccount;
import com.hotelshivar.backend.security.AuthInterceptor;
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
    private final com.hotelshivar.backend.service.RazorpayPaymentService razorpayPayments;

    /** Tables staff can take orders for (number, seats, status). */
    @GetMapping("/config")
    public Map<String, Object> config() {
        List<RestaurantTable> tables = orderService.orderableTables();
        return Map.of("tableCount", tables.size(), "tables", tables);
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
    public ResponseEntity<FoodOrder> online(@Valid @RequestBody OnlineOrderRequest request,
            @RequestAttribute(value = AuthInterceptor.CUSTOMER_ATTRIBUTE, required = false) CustomerAccount customer) {
        // a logged-in website customer gets the order in their account
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOnline(request, customer != null ? customer.getId() : null));
    }

    /** Public: the customer pays for their order (identified by its secret tracking code). */
    @PostMapping("/online/{code}/pay")
    public TrackResponse pay(@PathVariable String code, @Valid @RequestBody PayRequest request) {
        return orderService.pay(code, request);
    }

    /** Public (tracking code): open Razorpay Checkout for this order. */
    @PostMapping("/online/{code}/razorpay/order")
    public Map<String, Object> razorpayOrder(@PathVariable String code) {
        return razorpayPayments.start(code);
    }

    /** Public (tracking code): Checkout finished - verify the payment with Razorpay. */
    @PostMapping("/online/{code}/razorpay/verify")
    public TrackResponse razorpayVerify(@PathVariable String code, @RequestBody Map<String, String> body) {
        return razorpayPayments.verify(code, body.get("razorpay_order_id"), body.get("razorpay_payment_id"), body.get("razorpay_signature"));
    }

    /** Public (tracking code): Checkout reported a failed payment. */
    @PostMapping("/online/{code}/razorpay/failed")
    public TrackResponse razorpayFailed(@PathVariable String code, @RequestBody Map<String, String> body) {
        return razorpayPayments.failed(code, body.get("payment_id"), body.get("reason"));
    }

    /** Public: order status and payment for the customer's tracking page. */
    @GetMapping("/track/{code}")
    public TrackResponse track(@PathVariable String code) {
        return orderService.track(code);
    }
}

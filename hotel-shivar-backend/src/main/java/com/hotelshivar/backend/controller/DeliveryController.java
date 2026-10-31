package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.DeliveryBoyRequest;
import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.security.AuthInterceptor;
import com.hotelshivar.backend.service.DeliveryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Home delivery (see DeliveryService).
 *   /api/admin/delivery-boys            - delivery boy logins (Order User)
 *   /api/admin/online-orders/{id}/assign - give an order to a delivery boy
 *   /api/delivery/orders/...            - the logged-in delivery boy's own orders
 * Who may call which is in AccessPolicy.
 */
@RestController
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService service;

    // ---- delivery boy accounts
    @GetMapping("/api/admin/delivery-boys")
    public List<DeliveryService.DeliveryBoy> list() {
        return service.deliveryBoys();
    }

    @PostMapping("/api/admin/delivery-boys")
    public ResponseEntity<DeliveryService.DeliveryBoy> create(@Valid @RequestBody DeliveryBoyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createDeliveryBoy(request));
    }

    @PutMapping("/api/admin/delivery-boys/{id}")
    public DeliveryService.DeliveryBoy update(@PathVariable Long id, @Valid @RequestBody DeliveryBoyRequest request) {
        return service.updateDeliveryBoy(id, request);
    }

    @DeleteMapping("/api/admin/delivery-boys/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteDeliveryBoy(id);
        return ResponseEntity.noContent().build();
    }

    // ---- assigning
    /** {"deliveryBoyId": 12} (null = take the order back). */
    @PostMapping("/api/admin/online-orders/{id}/assign")
    public FoodOrder assign(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body,
                            @RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) AdminUser me) {
        Object v = body != null ? body.get("deliveryBoyId") : null;
        Long boyId = v instanceof Number n ? Long.valueOf(n.longValue())
                : v instanceof String s && !s.isBlank() ? Long.valueOf(s.trim()) : null;
        return service.assign(id, boyId, me);
    }

    /** Delivery Dispatch: {"deliveryBoyId": 12} (optional - empty = the delivery boy already assigned). */
    @PostMapping("/api/admin/online-orders/{id}/dispatch")
    public FoodOrder dispatch(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body,
                              @RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) AdminUser me) {
        Object v = body != null ? body.get("deliveryBoyId") : null;
        Long boyId = v instanceof Number n ? Long.valueOf(n.longValue())
                : v instanceof String s && !s.isBlank() ? Long.valueOf(s.trim()) : null;
        return service.dispatch(id, boyId, me);
    }

    // ---- delivery boy: my orders
    @GetMapping("/api/delivery/orders")
    public Map<String, Object> mine(@RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) AdminUser me) {
        List<FoodOrder> orders = service.myOrders(me);
        Map<String, Object> out = new LinkedHashMap<>(service.summary(orders));
        out.put("orders", orders);
        out.put("serverTime", java.time.LocalDateTime.now()); // for the countdown (phone clocks can be off)
        out.put("acceptSeconds", service.acceptSeconds());
        return out;
    }

    /** Accept a Ready order: it goes Out for delivery at once. */
    @PostMapping("/api/delivery/orders/{id}/accept")
    public FoodOrder accept(@PathVariable Long id, @RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) AdminUser me) {
        return service.accept(id, me);
    }

    @PostMapping("/api/delivery/orders/{id}/decline")
    public FoodOrder decline(@PathVariable Long id, @RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) AdminUser me) {
        return service.decline(id, me);
    }

    @PostMapping("/api/delivery/orders/{id}/deliver")
    public FoodOrder deliver(@PathVariable Long id, @RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) AdminUser me) {
        return service.deliver(id, me);
    }
}

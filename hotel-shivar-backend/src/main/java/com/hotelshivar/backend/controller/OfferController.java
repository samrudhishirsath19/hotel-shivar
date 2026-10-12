package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.OfferRequest;
import com.hotelshivar.backend.entity.Offer;
import com.hotelshivar.backend.service.OfferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/offers")
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;

    @GetMapping
    public List<Offer> getOffers(@RequestParam(required = false) Boolean activeOnly) {
        return Boolean.TRUE.equals(activeOnly) ? offerService.getActiveOffers() : offerService.getAllOffers();
    }

    /**
     * Public: check an offer code before booking / ordering.
     * kind=ROOM (amount = room charges, nights, checkIn) or kind=FOOD (amount = food total).
     */
    @GetMapping("/check")
    public java.util.Map<String, Object> check(@RequestParam String code, @RequestParam(defaultValue = "ROOM") String kind,
                                              @RequestParam java.math.BigDecimal amount,
                                              @RequestParam(defaultValue = "1") int nights,
                                              @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(
                                                      iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate checkIn) {
        return toMap(offerService.quote(code, !"FOOD".equalsIgnoreCase(kind), amount, nights, checkIn));
    }

    /** Public: the offer applied automatically to this bill when no code is typed (valid=false if none fits). */
    @GetMapping("/best")
    public java.util.Map<String, Object> best(@RequestParam(defaultValue = "ROOM") String kind,
                                             @RequestParam java.math.BigDecimal amount,
                                             @RequestParam(defaultValue = "1") int nights,
                                             @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(
                                                     iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate checkIn) {
        return toMap(offerService.best(!"FOOD".equalsIgnoreCase(kind), amount, nights, checkIn));
    }

    private static java.util.Map<String, Object> toMap(OfferService.Quote q) {
        java.util.Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("valid", q.valid());
        out.put("message", q.message());
        out.put("discount", q.discount());
        out.put("code", q.offer() != null ? q.offer().getCode() : null);
        out.put("title", q.offer() != null ? q.offer().getTitle() : null);
        out.put("discountPercent", q.offer() != null ? q.offer().getDiscountPercent() : null);
        return out;
    }

    @GetMapping("/{id:[0-9]+}")
    public Offer getOffer(@PathVariable Long id) {
        return offerService.getOfferById(id);
    }

    @PostMapping
    public ResponseEntity<Offer> createOffer(@Valid @RequestBody OfferRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(offerService.createOffer(request));
    }

    @PutMapping("/{id}")
    public Offer updateOffer(@PathVariable Long id, @Valid @RequestBody OfferRequest request) {
        return offerService.updateOffer(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOffer(@PathVariable Long id) {
        offerService.deleteOffer(id);
        return ResponseEntity.noContent().build();
    }
}

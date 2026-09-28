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

    @GetMapping("/{id}")
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

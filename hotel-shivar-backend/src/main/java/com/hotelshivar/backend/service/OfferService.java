package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.OfferRequest;
import com.hotelshivar.backend.entity.Offer;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.OfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OfferService {

    private final OfferRepository offerRepository;

    public List<Offer> getAllOffers() {
        return offerRepository.findAll();
    }

    public List<Offer> getActiveOffers() {
        return offerRepository.findByActiveTrue();
    }

    public Offer getOfferById(Long id) {
        return offerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found with id: " + id));
    }

    public Offer createOffer(OfferRequest request) {
        Offer offer = Offer.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .discountPercent(request.getDiscountPercent())
                .validFrom(request.getValidFrom())
                .validTo(request.getValidTo())
                .imageUrl(request.getImageUrl())
                .active(request.getActive() == null || request.getActive())
                .build();
        return offerRepository.save(offer);
    }

    public Offer updateOffer(Long id, OfferRequest request) {
        Offer offer = getOfferById(id);
        offer.setTitle(request.getTitle());
        offer.setDescription(request.getDescription());
        offer.setDiscountPercent(request.getDiscountPercent());
        offer.setValidFrom(request.getValidFrom());
        offer.setValidTo(request.getValidTo());
        offer.setImageUrl(request.getImageUrl());
        if (request.getActive() != null) {
            offer.setActive(request.getActive());
        }
        return offerRepository.save(offer);
    }

    public void deleteOffer(Long id) {
        offerRepository.delete(getOfferById(id));
    }
}

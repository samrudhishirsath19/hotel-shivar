package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OfferRepository extends JpaRepository<Offer, Long> {
    List<Offer> findByActiveTrue();
}

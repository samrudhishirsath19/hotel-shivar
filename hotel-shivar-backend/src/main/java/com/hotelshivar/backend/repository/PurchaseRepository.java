package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByPurchasedOnBetweenOrderByPurchasedOnDescIdDesc(LocalDate from, LocalDate to);
}

package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findAllByOrderByNameAsc();
    Optional<InventoryItem> findByNameIgnoreCase(String name);
}

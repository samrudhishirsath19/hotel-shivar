package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    List<RestaurantTable> findAllByOrderByTableNumberAsc();
    Optional<RestaurantTable> findByTableNumber(Integer tableNumber);
}

package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByAvailableTrueOrderByCategoryAscNameAsc();
    List<MenuItem> findAllByOrderByCategoryAscNameAsc();
}

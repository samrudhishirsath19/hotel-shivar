package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.InventoryIssue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface InventoryIssueRepository extends JpaRepository<InventoryIssue, Long> {
    List<InventoryIssue> findByIssuedOnBetweenOrderByIssuedOnDescIdDesc(LocalDate from, LocalDate to);
}

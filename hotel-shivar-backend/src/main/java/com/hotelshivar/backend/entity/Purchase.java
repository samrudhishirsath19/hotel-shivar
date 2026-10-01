package com.hotelshivar.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Stock bought from a supplier. Item name and unit are copied so old purchases never change. */
@Entity
@Table(name = "purchases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long inventoryItemId;

    @Column(nullable = false)
    private String itemName;

    @Column(length = 30)
    private String unit;

    private String supplier;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitCost;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalCost;

    @Column(nullable = false)
    private LocalDate purchasedOn;

    @Column(length = 500)
    private String note;
}

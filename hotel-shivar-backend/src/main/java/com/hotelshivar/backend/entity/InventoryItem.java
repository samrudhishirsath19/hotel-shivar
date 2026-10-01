package com.hotelshivar.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** A stock item in the kitchen / store (rice, oil, water bottles...). */
@Entity
@Table(name = "inventory_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    /** kg, litre, piece, packet ... */
    @Column(nullable = false, length = 30)
    private String unit;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    /** Shown as LOW when the quantity falls to this level or below. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal minLevel;
}

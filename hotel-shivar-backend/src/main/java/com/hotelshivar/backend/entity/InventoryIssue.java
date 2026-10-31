package com.hotelshivar.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Inventory Out: stock taken out of the store (to the kitchen, housekeeping, wastage ...).
 * Item name and unit are copied so old entries never change. The stock goes down when it is saved.
 */
@Entity
@Table(name = "inventory_issues")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long inventoryItemId;

    @Column(nullable = false)
    private String itemName;

    @Column(length = 30)
    private String unit;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    /** Day the stock went out. */
    @Column(nullable = false)
    private LocalDate issuedOn;

    /** Person who issued the stock (store keeper / manager). */
    @Column(nullable = false, length = 100)
    private String issuedBy;

    /** Who / where it went to, e.g. "Kitchen", "Housekeeping" (optional). */
    @Column(length = 100)
    private String issuedTo;

    @Column(length = 500)
    private String note;

    /** Staff login that saved the entry (for the record; may differ from issuedBy). */
    @Column(length = 100)
    private String recordedBy;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

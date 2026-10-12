package com.hotelshivar.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A promotion shown on the Offers page. Customers enter its code when they book a room or place an online
 * order; the discount is taken off before GST. Managed in the dashboard (Offers page).
 */
@Entity
@Table(name = "offers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Offer {

    /** What an offer can be used on. */
    public enum AppliesTo { ROOMS, FOOD, ALL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    /** What the customer types, e.g. MONSOON20 (stored upper case, unique). Offers without a code are display-only. */
    @Column(length = 30, unique = true)
    private String code;

    private Integer discountPercent;

    /** Optional cap on the discount in rupees. */
    @Column(precision = 10, scale = 2)
    private BigDecimal maxDiscount;

    /** Optional minimum bill (before discount) in rupees. */
    @Column(precision = 10, scale = 2)
    private BigDecimal minAmount;

    /** Rooms: minimum number of nights (optional). */
    private Integer minNights;

    /** Rooms: only for check-ins from Monday to Thursday. */
    @Builder.Default
    private Boolean weekdaysOnly = false;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(10)")
    @Builder.Default
    private AppliesTo appliesTo = AppliesTo.ROOMS;

    /** First and last day the code can be used (both optional). */
    private LocalDate validFrom;
    private LocalDate validTo;

    /** Optional: how many times the code may be used in total. */
    private Integer usageLimit;

    @Builder.Default
    private Integer usedCount = 0;

    private String imageUrl;

    @Builder.Default
    private Boolean active = true;
}

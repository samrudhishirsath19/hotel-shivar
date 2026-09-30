package com.hotelshivar.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * GST settings, managed by the super admin (one row, id = 1).
 * Defaults follow the GST rates in force since 22 Sep 2025 (Notification 15/2025-CT(Rate)):
 *   restaurant food 5% (2.5% CGST + 2.5% SGST), room up to Rs 7,500 per night 5%, above Rs 7,500 18%.
 * Prices on the menu and rooms are WITHOUT GST; GST is added once on top, CGST and SGST half each
 * (intra-state supply - the hotel and the service are in the same state).
 */
@Entity
@Table(name = "gst_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GstSettings {

    @Id
    private Long id;

    /** false = no GST is added to new bills (e.g. not registered under GST). */
    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    /** Restaurant food and drinks (table, room service, online). */
    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal foodRate = new BigDecimal("5.00");

    /** Room tariff per night up to and including the threshold. */
    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal roomRateLow = new BigDecimal("5.00");

    /** Room tariff per night above the threshold. */
    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal roomRateHigh = new BigDecimal("18.00");

    /** Rs per room per night. */
    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal roomThreshold = new BigDecimal("7500.00");

    /** Shown on invoices. */
    @Column(length = 15)
    private String gstin;

    @Column(length = 150)
    @Builder.Default
    private String legalName = "Hotel Shivar";

    @Column(length = 300)
    @Builder.Default
    private String address = "Kamshet, Maharashtra";

    /** SAC codes printed on invoices. */
    @Column(length = 10)
    @Builder.Default
    private String sacFood = "996331";

    @Column(length = 10)
    @Builder.Default
    private String sacRoom = "996311";

    private LocalDateTime updatedAt;
}

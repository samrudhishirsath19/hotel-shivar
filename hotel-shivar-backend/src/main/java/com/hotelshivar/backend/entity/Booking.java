package com.hotelshivar.backend.entity;

import com.hotelshivar.backend.entity.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false)
    private String guestName;

    @Column(nullable = false)
    private String email;

    private String phone;

    @Column(nullable = false)
    private LocalDate checkIn;

    @Column(nullable = false)
    private LocalDate checkOut;

    @Column(nullable = false)
    private Integer numberOfGuests;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Column(length = 1000)
    private String specialRequests;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /** Nights x price per night (without GST). Null on bookings saved before GST was added. */
    private Integer nights;

    @Column(precision = 12, scale = 2)
    private BigDecimal roomCharges;

    // ------------------------------------------------------------------ GST (worked out once, stored)

    /** Total GST % applied (CGST + SGST); null on records saved before GST was added. */
    @Column(precision = 5, scale = 2)
    private BigDecimal gstRate;

    @Column(precision = 12, scale = 2)
    private BigDecimal cgstAmount;

    @Column(precision = 12, scale = 2)
    private BigDecimal sgstAmount;

    /** cgstAmount + sgstAmount */
    @Column(precision = 12, scale = 2)
    private BigDecimal taxAmount;

    /** Taxable amount + GST = what the guest pays. */
    @Column(precision = 12, scale = 2)
    private BigDecimal grandTotal;

    /** What is charged: the amount with GST, or (old records without GST) the plain amount. Sent to the screens as "amountPayable". */
    public BigDecimal getAmountPayable() {
        return grandTotal != null ? grandTotal : roomCharges;
    }

    public void applyTax(com.hotelshivar.backend.service.GstService.Tax t) {
        this.gstRate = t.rate();
        this.cgstAmount = t.cgst();
        this.sgstAmount = t.sgst();
        this.taxAmount = t.tax();
        this.grandTotal = t.total();
    }
}

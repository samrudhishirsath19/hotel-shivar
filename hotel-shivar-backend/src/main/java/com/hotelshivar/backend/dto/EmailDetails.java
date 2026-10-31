package com.hotelshivar.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * What each email shows. Plain values copied from the booking / order while the database session is still open,
 * so the email (sent later, on another thread) never touches lazy JPA objects.
 */
public final class EmailDetails {

    private EmailDetails() { }

    public record Booking(String to, String guestName, Long bookingId, String roomName, String roomType,
                          LocalDate checkIn, LocalDate checkOut, int nights, int guests,
                          BigDecimal roomCharges, String offerTitle, BigDecimal discount,
                          BigDecimal tax, BigDecimal total, String status, String trackingLink) { }

    public record Line(String name, int quantity, BigDecimal unitPrice, BigDecimal amount) { }

    public record Order(String to, String customerName, Long orderId, List<Line> lines, BigDecimal subtotal,
                        String offerTitle, BigDecimal discount, BigDecimal tax, BigDecimal total,
                        String paymentMethod, String deliveryAddress, String trackingLink) { }

    public record Receipt(String to, String customerName, Long orderId, String transactionId, String reference,
                          BigDecimal amount, LocalDateTime paidAt, String method, String status, String trackingLink) { }

    /** kind = "Booking" or "Order". refundAmount null = nothing was paid, so nothing to refund. */
    public record Cancellation(String to, String name, String kind, Long id, LocalDateTime cancelledAt,
                               BigDecimal refundAmount, String refundId, String refundMethod, String refundNote) { }
}

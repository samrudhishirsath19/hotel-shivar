package com.hotelshivar.backend.entity;

import com.hotelshivar.backend.entity.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One payment attempt or refund for an order. Every attempt is kept (also failed ones),
 * so the full transaction history of an order can be shown.
 */
@Entity
@Table(name = "payment_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction {

    public enum Kind { PAYMENT, REFUND }

    public enum Result { SUCCESS, FAILED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long orderId;

    /** Our payment id, e.g. pay_7K2... (refunds: rfnd_...). */
    @Column(nullable = false, length = 60)
    private String paymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private Kind kind;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(30)")
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private Result result;

    @Column(nullable = false)
    private BigDecimal amount;

    /** Which gateway handled it (DEMO, COUNTER, ...). */
    @Column(length = 40)
    private String gateway;

    /** Reference from the gateway / bank (UTR, card auth code, receipt no.). */
    @Column(length = 100)
    private String transactionRef;

    /** Masked payer detail, e.g. ra****@okaxis - never full card numbers. */
    @Column(length = 100)
    private String payerDetail;

    @Column(length = 300)
    private String message;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

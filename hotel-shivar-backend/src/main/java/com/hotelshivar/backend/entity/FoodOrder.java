package com.hotelshivar.backend.entity;

import com.hotelshivar.backend.entity.enums.KitchenStatus;
import com.hotelshivar.backend.entity.enums.OnlineOrderStatus;
import com.hotelshivar.backend.entity.enums.OrderStatus;
import com.hotelshivar.backend.entity.enums.OrderType;
import com.hotelshivar.backend.entity.enums.PaymentMethod;
import com.hotelshivar.backend.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A restaurant order. TABLE / ROOM orders stay OPEN while the table or room is being served;
 * the manager marks them PAID when the bill is settled. ONLINE orders start as PENDING.
 */
@Entity
@Table(name = "food_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(30)")
    private OrderType orderType;

    private Integer tableNumber;

    private String roomNumber;

    private String customerName;

    private String customerPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(30)")
    @Builder.Default
    private OrderStatus status = OrderStatus.OPEN;

    /**
     * Kitchen progress (PREPARING / READY). Kept nullable on purpose: orders saved before this
     * column existed have no value, and the screens treat "no value" as PREPARING.
     */
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(30)")
    @Builder.Default
    private KitchenStatus kitchenStatus = KitchenStatus.PREPARING;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime paidAt;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal total = BigDecimal.ZERO;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "food_order_lines", joinColumns = @JoinColumn(name = "order_id"))
    @Builder.Default
    private List<OrderLine> lines = new ArrayList<>();

    // ------------------------------------------------------------------ online delivery orders

    /** Where to deliver an online order. */
    @Column(length = 500)
    private String deliveryAddress;

    /** Optional note from the customer (landmark, "ring the bell", ...). */
    @Column(length = 300)
    private String deliveryNote;

    /** Secret code the customer uses to pay for and track the order (not the order id, so it cannot be guessed). */
    @Column(length = 40, unique = true)
    private String trackingCode;

    /** Placed -> Confirmed -> Preparing -> Ready -> Out for delivery -> Delivered (null for table / room orders). */
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(30)")
    private OnlineOrderStatus onlineStatus;

    private LocalDateTime deliveredAt;

    // ------------------------------------------------------------------ payment

    /** Null on orders saved before payments existed. */
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(30)")
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(30)")
    private PaymentMethod paymentMethod;

    /** Id of the successful payment (or of the last attempt / refund). */
    @Column(length = 60)
    private String paymentId;

    /** Gateway / bank reference of that payment. */
    @Column(length = 100)
    private String paymentRef;

    private LocalDateTime paymentUpdatedAt;

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
        return grandTotal != null ? grandTotal : total;
    }

    public void applyTax(com.hotelshivar.backend.service.GstService.Tax t) {
        this.gstRate = t.rate();
        this.cgstAmount = t.cgst();
        this.sgstAmount = t.sgst();
        this.taxAmount = t.tax();
        this.grandTotal = t.total();
    }
}

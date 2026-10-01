package com.hotelshivar.backend.entity;

import com.hotelshivar.backend.entity.enums.KitchenStatus;
import com.hotelshivar.backend.entity.enums.OrderStatus;
import com.hotelshivar.backend.entity.enums.OrderType;
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
}

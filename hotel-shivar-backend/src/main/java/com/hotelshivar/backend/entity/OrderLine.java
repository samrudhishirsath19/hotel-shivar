package com.hotelshivar.backend.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** One item on an order. Name and price are copied at order time so old sales never change. */
@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderLine {
    private Long menuItemId;
    private String name;
    private BigDecimal unitPrice;
    private Integer quantity;
}

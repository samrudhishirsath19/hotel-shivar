package com.hotelshivar.backend.dto;

import com.hotelshivar.backend.entity.FoodOrder;

import java.util.List;

/** Everything the manager needs on one screen. */
public record OrderBoard(int tableCount, List<TableSlot> tables, List<FoodOrder> rooms, List<FoodOrder> online) {

    /**
     * One table: seats, status set by the super admin (AVAILABLE / RESERVED / OUT_OF_SERVICE) and the
     * running order (null when the table is free).
     */
    public record TableSlot(int number, Integer capacity, String status, FoodOrder order) { }
}

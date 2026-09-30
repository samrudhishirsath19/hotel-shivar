package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.enums.OrderStatus;
import com.hotelshivar.backend.entity.enums.OrderType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {

    Optional<FoodOrder> findFirstByOrderTypeAndTableNumberAndStatus(OrderType type, Integer tableNumber, OrderStatus status);

    Optional<FoodOrder> findFirstByOrderTypeAndRoomNumberAndStatus(OrderType type, String roomNumber, OrderStatus status);

    List<FoodOrder> findByStatusInOrderByCreatedAtAsc(Collection<OrderStatus> statuses);

    List<FoodOrder> findByStatusAndPaidAtGreaterThanEqualAndPaidAtLessThan(OrderStatus status, LocalDateTime from, LocalDateTime to);
}

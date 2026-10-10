package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.enums.OrderStatus;
import com.hotelshivar.backend.entity.enums.OrderType;
import org.springframework.data.jpa.repository.JpaRepository;
<<<<<<< HEAD
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
=======
>>>>>>> origin/sakshi

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {

    Optional<FoodOrder> findFirstByOrderTypeAndTableNumberAndStatus(OrderType type, Integer tableNumber, OrderStatus status);

    Optional<FoodOrder> findFirstByOrderTypeAndRoomNumberAndStatus(OrderType type, String roomNumber, OrderStatus status);

    List<FoodOrder> findByStatusInOrderByCreatedAtAsc(Collection<OrderStatus> statuses);

<<<<<<< HEAD
    Optional<FoodOrder> findByTrackingCode(String trackingCode);

    @Query("""
           select o from FoodOrder o
           where o.orderType = :type and (o.createdAt >= :since or o.status in :running)
           order by o.createdAt desc
           """)
    List<FoodOrder> findOnlineSince(@Param("type") OrderType type, @Param("since") LocalDateTime since,
                                    @Param("running") Collection<OrderStatus> running);

=======
>>>>>>> origin/sakshi
    List<FoodOrder> findByStatusAndPaidAtGreaterThanEqualAndPaidAtLessThan(OrderStatus status, LocalDateTime from, LocalDateTime to);
}

package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.enums.OrderStatus;
import com.hotelshivar.backend.entity.enums.OrderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {

    Optional<FoodOrder> findFirstByOrderTypeAndTableNumberAndStatus(OrderType type, Integer tableNumber, OrderStatus status);

    Optional<FoodOrder> findFirstByOrderTypeAndRoomNumberAndStatus(OrderType type, String roomNumber, OrderStatus status);

    List<FoodOrder> findByStatusInOrderByCreatedAtAsc(Collection<OrderStatus> statuses);

    Optional<FoodOrder> findByTrackingCode(String trackingCode);

    Optional<FoodOrder> findByGatewayOrderId(String gatewayOrderId);

    /**
     * A delivery boy's work: every order assigned to him that is still running (however long ago it was placed)
     * plus the ones delivered since `deliveredSince`.
     */
    @org.springframework.data.jpa.repository.Query("select o from FoodOrder o where o.deliveryBoyId = :boyId"
            + " and (o.status = com.hotelshivar.backend.entity.enums.OrderStatus.ACCEPTED or o.deliveredAt >= :deliveredSince)")
    List<FoodOrder> findDeliveryWork(@org.springframework.data.repository.query.Param("boyId") Long boyId,
                                     @org.springframework.data.repository.query.Param("deliveredSince") java.time.LocalDateTime deliveredSince);

    /** Same, for all delivery boys (workload on the Delivery Boys / Dispatch pages and the automatic choice). */
    @org.springframework.data.jpa.repository.Query("select o from FoodOrder o where o.deliveryBoyId is not null"
            + " and (o.status = com.hotelshivar.backend.entity.enums.OrderStatus.ACCEPTED or o.deliveredAt >= :deliveredSince)")
    List<FoodOrder> findAllDeliveryWork(@org.springframework.data.repository.query.Param("deliveredSince") java.time.LocalDateTime deliveredSince);

    /** Orders sent to a delivery boy whose time to accept has run out. */
    List<FoodOrder> findByDeliveryAcceptedAtIsNullAndAcceptByBefore(java.time.LocalDateTime now);

    List<FoodOrder> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    @Query("""
           select o from FoodOrder o
           where o.orderType = :type and (o.createdAt >= :since or o.status in :running)
           order by o.createdAt desc
           """)
    List<FoodOrder> findOnlineSince(@Param("type") OrderType type, @Param("since") LocalDateTime since,
                                    @Param("running") Collection<OrderStatus> running);

    List<FoodOrder> findByStatusAndPaidAtGreaterThanEqualAndPaidAtLessThan(OrderStatus status, LocalDateTime from, LocalDateTime to);
}

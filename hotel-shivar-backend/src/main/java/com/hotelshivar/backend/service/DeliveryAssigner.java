package com.hotelshivar.backend.service;

import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.enums.OnlineOrderStatus;
import com.hotelshivar.backend.entity.enums.OrderStatus;
import com.hotelshivar.backend.entity.enums.OrderType;
import com.hotelshivar.backend.repository.AdminUserRepository;
import com.hotelshivar.backend.repository.FoodOrderRepository;
import com.hotelshivar.backend.security.Roles;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Picks a delivery boy automatically when the kitchen marks an online order Ready (or when the assigned one
 * declines it): the delivery boy on duty with the fewest orders in hand; on a tie, the one who got an order
 * longest ago (so the work is shared out). Changes the order only - the caller saves it.
 */
@Component
@RequiredArgsConstructor
public class DeliveryAssigner {

    public static final String AUTO = "Auto-assigned";

    private final AdminUserRepository userRepository;
    private final FoodOrderRepository orderRepository;

    /** How long a delivery boy has to accept an order sent to him (default 2 minutes). */
    @Value("${app.delivery.accept-seconds:120}")
    private int acceptSeconds;

    public int acceptSeconds() {
        return acceptSeconds;
    }

    /**
     * Starts (or restarts) the time to accept: only when the order has been sent to a delivery boy AND the food is
     * Ready - before that he cannot accept it anyway.
     */
    public void startAcceptClock(FoodOrder o) {
        if (o.getDeliveryBoyId() != null && o.getDispatchedAt() != null && o.getDeliveryAcceptedAt() == null
                && o.getOnlineStatus() == OnlineOrderStatus.READY) {
            o.setAcceptBy(LocalDateTime.now().plusSeconds(acceptSeconds));
        }
    }

    /**
     * Time ran out: take the order back from the delivery boy and suggest the next free one (not him). The order
     * is back under "Ready - to dispatch" for the Order User.
     */
    public void takeBack(FoodOrder o) {
        Long missed = o.getDeliveryBoyId();
        o.setAcceptTimedOutBy(o.getDeliveryBoyName());
        o.setDeliveryBoyId(null);
        o.setDeliveryBoyName(null);
        o.setDeliveryBoyPhone(null);
        o.setDeliveryAssignedAt(null);
        o.setDeliveryAssignedBy(null);
        o.setDispatchedAt(null);
        o.setDispatchedBy(null);
        o.setAcceptBy(null);
        autoAssign(o, missed);
    }

    /** Assigns the order if it is an online order without a delivery boy. excludeId = skip this delivery boy. */
    public Optional<AdminUser> autoAssign(FoodOrder o, Long excludeId) {
        if (o.getOrderType() != OrderType.ONLINE || o.getDeliveryBoyId() != null) {
            return Optional.empty();
        }
        List<AdminUser> onDuty = userRepository.findByRoleOrderByNameAsc(Roles.DELIVERY_BOY).stream()
                .filter(u -> Boolean.TRUE.equals(u.getActive()) && !u.getId().equals(excludeId))
                .toList();
        if (onDuty.isEmpty()) {
            return Optional.empty(); // nobody on duty: the Order User assigns it by hand
        }
        Map<Long, Integer> load = new HashMap<>();
        Map<Long, LocalDateTime> lastGiven = new HashMap<>();
        for (FoodOrder x : orderRepository.findAllDeliveryWork(LocalDate.now().atStartOfDay())) {
            if (x.getId().equals(o.getId())) {
                continue;
            }
            if (isActive(x)) {
                load.merge(x.getDeliveryBoyId(), 1, Integer::sum);
            }
            if (x.getDeliveryAssignedAt() != null) {
                lastGiven.merge(x.getDeliveryBoyId(), x.getDeliveryAssignedAt(), (a, b) -> a.isAfter(b) ? a : b);
            }
        }
        AdminUser boy = onDuty.stream()
                .min(Comparator.<AdminUser>comparingInt(u -> load.getOrDefault(u.getId(), 0))
                        .thenComparing(u -> lastGiven.getOrDefault(u.getId(), LocalDateTime.MIN)))
                .orElseThrow();
        give(o, boy, AUTO);
        return Optional.of(boy);
    }

    public static void give(FoodOrder o, AdminUser boy, String by) {
        o.setDeliveryBoyId(boy.getId());
        o.setDeliveryBoyName(boy.getName());
        o.setDeliveryBoyPhone(boy.getPhone());
        o.setDeliveryAssignedAt(LocalDateTime.now());
        o.setDeliveryAcceptedAt(null); // he has to accept it
        o.setDeliveryAssignedBy(by);
        o.setDispatchedAt(null);       // and the Order User has to dispatch it to him
        o.setDispatchedBy(null);
        o.setAcceptBy(null);           // the time to accept starts when it is sent to him
    }

    public static boolean isActive(FoodOrder o) {
        return o.getStatus() == OrderStatus.ACCEPTED
                && o.getOnlineStatus() != OnlineOrderStatus.DELIVERED && o.getOnlineStatus() != OnlineOrderStatus.CANCELLED;
    }
}

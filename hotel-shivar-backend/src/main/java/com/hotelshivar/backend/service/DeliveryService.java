package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.DeliveryBoyRequest;
import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.enums.OnlineOrderStatus;
import com.hotelshivar.backend.entity.enums.OrderStatus;
import com.hotelshivar.backend.entity.enums.OrderType;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.exception.ForbiddenException;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.AdminUserRepository;
import com.hotelshivar.backend.repository.FoodOrderRepository;
import com.hotelshivar.backend.security.Roles;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Home delivery of online orders.
 * <ul>
 *   <li>Order User (or anyone with "Assign delivery boy"): assigns each confirmed order to one delivery boy,
 *       and can reassign it until it is picked up.</li>
 *   <li>When the kitchen marks an order Ready it is assigned automatically ({@link DeliveryAssigner}).</li>
 *   <li>Delivery boy: sees only the orders assigned to him; he alone accepts (the order then goes Out for delivery
 *       straight away) and delivers them. Several delivery boys work at the same time, each with his own orders.</li>
 *   <li>"Manage delivery boys": create / edit / switch off delivery boy logins (role DELIVERY_BOY only).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final FoodOrderRepository orderRepository;
    private final AdminUserRepository userRepository;
    private final OrderService orderService;
    private final PasswordEncoder passwordEncoder;
    private final DeliveryAssigner assigner;

    /** A delivery boy with his current load, for the assign list and the Delivery Boys page. */
    public record DeliveryBoy(Long id, String name, String email, String phone, boolean active,
                              long activeOrders, long deliveredToday, LocalDateTime lastLoginAt) { }

    // ------------------------------------------------------------------ delivery boy accounts (Order User)

    @Transactional(readOnly = true)
    public List<DeliveryBoy> deliveryBoys() {
        List<FoodOrder> recent = orderRepository.findAllDeliveryWork(LocalDate.now().atStartOfDay());
        return userRepository.findByRoleOrderByNameAsc(Roles.DELIVERY_BOY).stream().map(u -> new DeliveryBoy(
                u.getId(), u.getName(), u.getEmail(), u.getPhone(), Boolean.TRUE.equals(u.getActive()),
                recent.stream().filter(o -> u.getId().equals(o.getDeliveryBoyId()) && isActive(o)).count(),
                recent.stream().filter(o -> u.getId().equals(o.getDeliveryBoyId()) && o.getDeliveredAt() != null
                        && o.getDeliveredAt().toLocalDate().equals(LocalDate.now())).count(),
                u.getLastLoginAt())).toList();
    }

    @Transactional
    public DeliveryBoy createDeliveryBoy(DeliveryBoyRequest r) {
        String email = r.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BadRequestException("A login with this email already exists");
        }
        if (r.getPassword() == null || r.getPassword().length() < 8) {
            throw new BadRequestException("Password must be at least 8 characters");
        }
        AdminUser u = userRepository.save(AdminUser.builder()
                .name(r.getName()).email(email).phone(r.getPhone())
                .role(Roles.DELIVERY_BOY)
                .passwordHash(passwordEncoder.encode(r.getPassword()))
                .active(r.getActive() == null || r.getActive())
                .build());
        return find(u.getId());
    }

    /** Name, phone, on/off and (optional) new password. Email (the login id) does not change. */
    @Transactional
    public DeliveryBoy updateDeliveryBoy(Long id, DeliveryBoyRequest r) {
        AdminUser u = deliveryBoyAccount(id);
        boolean active = r.getActive() == null || r.getActive();
        if (!active && hasActiveOrders(u.getId())) {
            throw new BadRequestException(u.getName() + " still has orders to deliver - reassign them first");
        }
        u.setName(r.getName());
        u.setPhone(r.getPhone());
        u.setActive(active);
        if (r.getPassword() != null && !r.getPassword().isBlank()) {
            if (r.getPassword().length() < 8) {
                throw new BadRequestException("Password must be at least 8 characters");
            }
            u.setPasswordHash(passwordEncoder.encode(r.getPassword()));
        }
        userRepository.save(u);
        return find(id);
    }

    @Transactional
    public void deleteDeliveryBoy(Long id) {
        AdminUser u = deliveryBoyAccount(id);
        if (hasActiveOrders(u.getId())) {
            throw new BadRequestException(u.getName() + " still has orders to deliver - reassign them first");
        }
        userRepository.delete(u); // past orders keep his name (copied on the order)
    }

    // ------------------------------------------------------------------ assigning orders

    /** Order User: give the order to a delivery boy (null = take it back). Possible until it is picked up. */
    @Transactional
    public FoodOrder assign(Long orderId, Long deliveryBoyId, AdminUser by) {
        FoodOrder o = onlineOrder(orderId);
        if (o.getStatus() != OrderStatus.ACCEPTED) {
            throw new BadRequestException(o.getStatus() == OrderStatus.PENDING
                    ? "Confirm the order first, then assign a delivery boy" : "This order is already closed");
        }
        OnlineOrderStatus st = o.getOnlineStatus() != null ? o.getOnlineStatus() : OnlineOrderStatus.CONFIRMED;
        if (st == OnlineOrderStatus.OUT_FOR_DELIVERY || st == OnlineOrderStatus.DELIVERED || o.getDeliveryAcceptedAt() != null) {
            throw new BadRequestException(o.getDeliveryBoyName() + " has accepted it and is on the way - it cannot be reassigned now");
        }
        if (deliveryBoyId == null) {
            clearAssignment(o);
        } else {
            AdminUser boy = deliveryBoyAccount(deliveryBoyId);
            if (!Boolean.TRUE.equals(boy.getActive())) {
                throw new BadRequestException(boy.getName() + " is switched off - choose another delivery boy");
            }
            if (!boy.getId().equals(o.getDeliveryBoyId())) {
                DeliveryAssigner.give(o, boy, by != null ? by.getName() : null); // the new delivery boy has to accept it
            }
            // assigned by a person = sent to him: it shows in his Pending Orders with Accept (once the food is Ready).
            // Only automatic suggestions wait for the Order User to dispatch them.
            if (o.getDispatchedAt() == null) {
                o.setDispatchedAt(LocalDateTime.now());
                o.setDispatchedBy(by != null ? by.getName() : null);
                o.setAcceptTimedOutBy(null);
                assigner.startAcceptClock(o); // he has 2 minutes to accept (once the food is Ready)
            }
        }
        return orderRepository.save(o);
    }

    /**
     * Delivery Dispatch (Order User): send a Ready order out with a delivery boy - the one already assigned
     * (e.g. automatically) or another one chosen now. The delivery boy then accepts it and it goes Out for delivery.
     * Can be done again with another delivery boy until it is accepted.
     */
    @Transactional
    public FoodOrder dispatch(Long orderId, Long deliveryBoyId, AdminUser by) {
        FoodOrder o = onlineOrder(orderId);
        if (o.getStatus() != OrderStatus.ACCEPTED || o.getOnlineStatus() == OnlineOrderStatus.DELIVERED) {
            throw new BadRequestException("This order is already closed");
        }
        if (o.getDeliveryAcceptedAt() != null || o.getOnlineStatus() == OnlineOrderStatus.OUT_FOR_DELIVERY) {
            throw new BadRequestException(o.getDeliveryBoyName() + " has already accepted it - it is out for delivery");
        }
        if (o.getOnlineStatus() != OnlineOrderStatus.READY) {
            throw new BadRequestException("Only orders the kitchen has marked Ready can be dispatched");
        }
        if (deliveryBoyId != null && !deliveryBoyId.equals(o.getDeliveryBoyId())) {
            AdminUser boy = deliveryBoyAccount(deliveryBoyId);
            if (!Boolean.TRUE.equals(boy.getActive())) {
                throw new BadRequestException(boy.getName() + " is off duty - choose another delivery boy");
            }
            DeliveryAssigner.give(o, boy, by != null ? by.getName() : null);
        }
        if (o.getDeliveryBoyId() == null) {
            throw new BadRequestException("Choose a delivery boy to dispatch this order");
        }
        o.setDispatchedAt(LocalDateTime.now());
        o.setDispatchedBy(by != null ? by.getName() : null);
        o.setAcceptTimedOutBy(null);
        assigner.startAcceptClock(o); // he has 2 minutes to accept
        return orderRepository.save(o);
    }

    // ------------------------------------------------------------------ delivery boy's own orders

    /** Orders assigned to me that are still running, plus the ones I delivered (or that were cancelled) today. */
    @Transactional(readOnly = true)
    public List<FoodOrder> myOrders(AdminUser me) {
        LocalDate today = LocalDate.now();
        // all running orders assigned to me - also ones placed days ago - and what I delivered today
        return orderRepository.findDeliveryWork(me.getId(), today.atStartOfDay()).stream()
                .filter(o -> isActive(o) || (o.getDeliveredAt() != null && o.getDeliveredAt().toLocalDate().equals(today)))
                .sorted(Comparator.comparing(FoodOrder::getCreatedAt).reversed())
                .toList();
    }

    /** The delivery boy accepts a Ready order: it goes Out for delivery at once. */
    @Transactional
    public FoodOrder accept(Long id, AdminUser me) {
        FoodOrder o = mine(id, me);
        if (!isActive(o)) {
            throw new BadRequestException("This order is already closed");
        }
        if (o.getOnlineStatus() == OnlineOrderStatus.OUT_FOR_DELIVERY) {
            return o; // already accepted
        }
        if (o.getOnlineStatus() != OnlineOrderStatus.READY) {
            throw new BadRequestException("The kitchen has not marked this order Ready yet");
        }
        if (o.getDispatchedAt() == null) {
            throw new BadRequestException("Wait until the Order User dispatches this order to you");
        }
        LocalDateTime now = LocalDateTime.now();
        if (o.getAcceptBy() != null && now.isAfter(o.getAcceptBy())) {
            assigner.takeBack(o);
            orderRepository.save(o);
            throw new BadRequestException("Time to accept ran out (" + assigner.acceptSeconds() / 60
                    + " minutes) - the order has gone back for reassignment");
        }
        o.setDeliveryAcceptedAt(now);
        FoodOrder out = orderService.moveOnline(o, OnlineOrderStatus.OUT_FOR_DELIVERY);
        out.setPickedUpAt(now);
        return orderRepository.save(out);
    }

    /**
     * Before accepting, the delivery boy can hand an order back. A Ready order goes to the next free delivery boy
     * automatically (not him again); otherwise it waits for the Order User / the next Ready.
     */
    @Transactional
    public FoodOrder decline(Long id, AdminUser me) {
        FoodOrder o = mine(id, me);
        if (o.getDeliveryAcceptedAt() != null || o.getOnlineStatus() == OnlineOrderStatus.OUT_FOR_DELIVERY
                || o.getOnlineStatus() == OnlineOrderStatus.DELIVERED) {
            throw new BadRequestException("You have already accepted this order");
        }
        clearAssignment(o);
        if (o.getOnlineStatus() == OnlineOrderStatus.READY) {
            assigner.autoAssign(o, me.getId());
        }
        return orderRepository.save(o);
    }

    /** Handed to the customer (cash collected for cash-on-delivery orders). */
    @Transactional
    public FoodOrder deliver(Long id, AdminUser me) {
        FoodOrder o = mine(id, me);
        if (o.getOnlineStatus() != OnlineOrderStatus.OUT_FOR_DELIVERY) {
            throw new BadRequestException("Accept the order first");
        }
        return orderService.moveOnline(o, OnlineOrderStatus.DELIVERED);
    }

    /** Summary for the delivery boy's screen. */
    public Map<String, Object> summary(List<FoodOrder> mine) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("toAccept", mine.stream().filter(o -> o.getOnlineStatus() == OnlineOrderStatus.READY && o.getDispatchedAt() != null
                && o.getDeliveryAcceptedAt() == null).count());
        m.put("active", mine.stream().filter(this::isActive).count());
        m.put("deliveredToday", mine.stream().filter(o -> o.getDeliveredAt() != null).count());
        return m;
    }

    // ------------------------------------------------------------------ helpers

    private FoodOrder mine(Long id, AdminUser me) {
        FoodOrder o = onlineOrder(id);
        if (o.getDeliveryBoyId() == null || !o.getDeliveryBoyId().equals(me.getId())) {
            throw new ForbiddenException("This order is not assigned to you");
        }
        return o;
    }

    private FoodOrder onlineOrder(Long id) {
        FoodOrder o = orderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        if (o.getOrderType() != OrderType.ONLINE) {
            throw new BadRequestException("Only online orders are delivered");
        }
        return o;
    }

    private AdminUser deliveryBoyAccount(Long id) {
        AdminUser u = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Delivery boy not found"));
        if (!Roles.DELIVERY_BOY.equals(u.getRole())) {
            throw new BadRequestException("This login is not a delivery boy");
        }
        return u;
    }

    private boolean hasActiveOrders(Long boyId) {
        return orderRepository.findDeliveryWork(boyId, LocalDate.now().atStartOfDay())
                .stream().anyMatch(this::isActive);
    }

    private boolean isActive(FoodOrder o) {
        return DeliveryAssigner.isActive(o);
    }

    private DeliveryBoy find(Long id) {
        return deliveryBoys().stream().filter(b -> b.id().equals(id)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Delivery boy not found"));
    }

    private static void clearAssignment(FoodOrder o) {
        o.setDeliveryBoyId(null);
        o.setDeliveryBoyName(null);
        o.setDeliveryBoyPhone(null);
        o.setDeliveryAssignedAt(null);
        o.setDeliveryAcceptedAt(null);
        o.setDeliveryAssignedBy(null);
        o.setDispatchedAt(null);
        o.setDispatchedBy(null);
        o.setAcceptBy(null);
    }

    /**
     * Every few seconds: orders whose delivery boy did not accept within the time (2 minutes) are taken back and
     * offered to the next delivery boy (shown under "Ready - to dispatch" on Delivery Dispatch).
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 5000, initialDelay = 10000)
    @Transactional
    public void takeBackExpired() {
        for (FoodOrder o : orderRepository.findByDeliveryAcceptedAtIsNullAndAcceptByBefore(LocalDateTime.now())) {
            if (o.getOnlineStatus() == OnlineOrderStatus.READY && o.getStatus() == OrderStatus.ACCEPTED) {
                assigner.takeBack(o);
            } else {
                o.setAcceptBy(null); // cancelled / moved on: nothing to take back
            }
            orderRepository.save(o);
        }
    }

    public int acceptSeconds() {
        return assigner.acceptSeconds();
    }
}

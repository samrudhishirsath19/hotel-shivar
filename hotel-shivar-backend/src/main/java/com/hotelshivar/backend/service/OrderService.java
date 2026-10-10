package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.AdjustOrderRequest;
<<<<<<< HEAD
import com.hotelshivar.backend.dto.BillPaymentRequest;
import com.hotelshivar.backend.dto.OnlineOrderRequest;
import com.hotelshivar.backend.dto.OrderBoard;
import com.hotelshivar.backend.dto.PayRequest;
import com.hotelshivar.backend.dto.TrackResponse;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.MenuItem;
import com.hotelshivar.backend.entity.OrderLine;
import com.hotelshivar.backend.entity.RestaurantTable;
import com.hotelshivar.backend.entity.enums.KitchenStatus;
import com.hotelshivar.backend.entity.enums.OnlineOrderStatus;
import com.hotelshivar.backend.entity.enums.OrderStatus;
import com.hotelshivar.backend.entity.enums.OrderType;
import com.hotelshivar.backend.entity.enums.PaymentMethod;
import com.hotelshivar.backend.entity.enums.PaymentStatus;
import com.hotelshivar.backend.payment.DemoPaymentGateway;
=======
import com.hotelshivar.backend.dto.OnlineOrderRequest;
import com.hotelshivar.backend.dto.OrderBoard;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.MenuItem;
import com.hotelshivar.backend.entity.OrderLine;
import com.hotelshivar.backend.entity.enums.KitchenStatus;
import com.hotelshivar.backend.entity.enums.OrderStatus;
import com.hotelshivar.backend.entity.enums.OrderType;
>>>>>>> origin/sakshi
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.FoodOrderRepository;
import com.hotelshivar.backend.repository.MenuItemRepository;
<<<<<<< HEAD
import com.hotelshivar.backend.repository.RestaurantTableRepository;
import com.hotelshivar.backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
=======
import com.hotelshivar.backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
>>>>>>> origin/sakshi
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final FoodOrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final RoomRepository roomRepository;
<<<<<<< HEAD
    private final RestaurantTableRepository tableRepository;
    private final TableService tableService;
    private final PaymentService paymentService;
    private final GstService gstService;

    /** Tables staff can pick when taking an order (out-of-service tables are left out). */
    public List<RestaurantTable> orderableTables() {
        return tableRepository.findAllByOrderByTableNumberAsc().stream()
                .filter(t -> t.getStatus() != com.hotelshivar.backend.entity.enums.TableStatus.OUT_OF_SERVICE)
                .toList();
=======

    @Value("${app.restaurant.table-count:5}")
    private int tableCount;

    public int getTableCount() {
        return tableCount;
>>>>>>> origin/sakshi
    }

    // ------------------------------------------------------------------ customer side

    /** Running order lines for a table or room (empty list when nothing is ordered). */
    @Transactional(readOnly = true)
    public List<OrderLine> currentLines(OrderType type, String number) {
        return findOpen(type, number).map(FoodOrder::getLines).orElseGet(ArrayList::new);
    }

    /** +1 / -1 of one item on a table's or room's running order. */
    @Transactional
    public FoodOrder adjust(AdjustOrderRequest r) {
        OrderType type = r.getType();
        if (type != OrderType.TABLE && type != OrderType.ROOM) {
            throw new BadRequestException("Order type must be TABLE or ROOM");
        }
        int delta = r.getDelta();
        if (delta == 0) {
            throw new BadRequestException("Quantity change cannot be 0");
        }
        String number = r.getNumber().trim();
<<<<<<< HEAD
        validateTarget(type, number, delta > 0);
=======
        validateTarget(type, number);
>>>>>>> origin/sakshi

        MenuItem item = menuItemRepository.findById(r.getMenuItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + r.getMenuItemId()));

        FoodOrder order = findOpen(type, number).orElse(null);
        if (order == null) {
            if (delta < 0) {
                return empty(type, number);
            }
            order = FoodOrder.builder()
                    .orderType(type)
                    .tableNumber(type == OrderType.TABLE ? Integer.valueOf(number) : null)
                    .roomNumber(type == OrderType.ROOM ? number : null)
                    .status(OrderStatus.OPEN)
                    .build();
        }

        Optional<OrderLine> existing = order.getLines().stream()
                .filter(l -> l.getMenuItemId().equals(item.getId()))
                .findFirst();

        if (existing.isPresent()) {
            int qty = existing.get().getQuantity() + delta;
            if (qty <= 0) {
                order.getLines().remove(existing.get());
            } else {
                existing.get().setQuantity(qty);
            }
        } else if (delta > 0) {
            requireAvailable(item);
            order.getLines().add(new OrderLine(item.getId(), item.getName(), item.getPrice(), delta));
        }

        if (order.getLines().isEmpty()) {
            if (order.getId() != null) {
                orderRepository.delete(order);
            }
            return empty(type, number);
        }
<<<<<<< HEAD
        applyTotals(order);
        if (delta > 0) {
            order.setKitchenStatus(KitchenStatus.PREPARING); // newly added items must be made
        }
        return orderRepository.save(order);
    }

    /**
     * A customer's online (delivery) order. It is PLACED with payment PENDING; it can be confirmed
     * once it is paid online, or straight away when the customer chose cash on delivery.
     */
    @Transactional
    public FoodOrder placeOnline(OnlineOrderRequest r) {
        PaymentMethod method = r.getPaymentMethod();
        if (method != null && !method.isOnline() && method != PaymentMethod.CASH_ON_DELIVERY) {
            throw new BadRequestException("Choose an online payment method or cash on delivery");
        }
=======
        order.setTotal(computeTotal(order));
<<<<<<< Updated upstream
        order.setKitchenStatus(KitchenStatus.PREPARING); // new / changed items must be made
=======
        if (delta > 0) {
            order.setKitchenStatus(KitchenStatus.PREPARING); // newly added items must be made
        }
>>>>>>> Stashed changes
        return orderRepository.save(order);
    }

    /** A customer's online order. Waits as PENDING until the manager accepts it. */
    @Transactional
    public FoodOrder placeOnline(OnlineOrderRequest r) {
>>>>>>> origin/sakshi
        Map<Long, Integer> wanted = new LinkedHashMap<>();
        for (OnlineOrderRequest.Item i : r.getItems()) {
            wanted.merge(i.getMenuItemId(), i.getQuantity(), Integer::sum);
        }

        FoodOrder order = FoodOrder.builder()
                .orderType(OrderType.ONLINE)
                .customerName(r.getCustomerName().trim())
                .customerPhone(r.getCustomerPhone().trim())
<<<<<<< HEAD
                .deliveryAddress(r.getDeliveryAddress().trim())
                .deliveryNote(r.getDeliveryNote() == null || r.getDeliveryNote().isBlank() ? null : r.getDeliveryNote().trim())
                .trackingCode(newTrackingCode())
                .status(OrderStatus.PENDING)
                .onlineStatus(OnlineOrderStatus.PLACED)
                .paymentStatus(PaymentStatus.PENDING)
                .paymentMethod(method)
=======
                .status(OrderStatus.PENDING)
>>>>>>> origin/sakshi
                .build();

        for (Map.Entry<Long, Integer> e : wanted.entrySet()) {
            MenuItem item = menuItemRepository.findById(e.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + e.getKey()));
            requireAvailable(item);
            order.getLines().add(new OrderLine(item.getId(), item.getName(), item.getPrice(), e.getValue()));
        }
<<<<<<< HEAD
        applyTotals(order);
=======
        order.setTotal(computeTotal(order));
>>>>>>> origin/sakshi
        return orderRepository.save(order);
    }

    // ------------------------------------------------------------------ staff side

    @Transactional(readOnly = true)
    public OrderBoard board() {
        List<FoodOrder> running = orderRepository.findByStatusInOrderByCreatedAtAsc(
                Set.of(OrderStatus.OPEN, OrderStatus.PENDING, OrderStatus.ACCEPTED));

        Map<Integer, FoodOrder> byTable = new LinkedHashMap<>();
<<<<<<< HEAD
        running = running.stream()
                .filter(o -> o.getOnlineStatus() != OnlineOrderStatus.OUT_FOR_DELIVERY) // left the kitchen
                .toList();
=======
>>>>>>> origin/sakshi
        List<FoodOrder> rooms = new ArrayList<>();
        List<FoodOrder> online = new ArrayList<>();
        for (FoodOrder o : running) {
            if (o.getOrderType() == OrderType.TABLE && o.getTableNumber() != null) {
                byTable.put(o.getTableNumber(), o);
            } else if (o.getOrderType() == OrderType.ROOM) {
                rooms.add(o);
            } else if (o.getOrderType() == OrderType.ONLINE) {
                online.add(o);
            }
        }

        List<OrderBoard.TableSlot> tables = new ArrayList<>();
<<<<<<< HEAD
        for (RestaurantTable t : tableRepository.findAllByOrderByTableNumberAsc()) {
            tables.add(new OrderBoard.TableSlot(t.getTableNumber(), t.getCapacity(), t.getStatus().name(),
                    byTable.remove(t.getTableNumber())));
        }
        // a running order on a table that no longer exists stays visible
        byTable.forEach((n, o) -> tables.add(new OrderBoard.TableSlot(n, null, "REMOVED", o)));
        return new OrderBoard(tables.size(), tables, rooms, online);
=======
        for (int n = 1; n <= tableCount; n++) {
            tables.add(new OrderBoard.TableSlot(n, byTable.get(n)));
        }
        return new OrderBoard(tableCount, tables, rooms, online);
>>>>>>> origin/sakshi
    }

    /** Paid bills between two dates (newest first). Default: today. */
    @Transactional(readOnly = true)
    public List<FoodOrder> paidOrders(LocalDate from, LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end;
        if (start.isAfter(end)) {
            throw new BadRequestException("'From' date must not be after 'To' date");
        }
        if (ChronoUnit.DAYS.between(start, end) > 92) {
            throw new BadRequestException("Please choose a range of at most 3 months");
        }
        List<FoodOrder> bills = new ArrayList<>(orderRepository.findByStatusAndPaidAtGreaterThanEqualAndPaidAtLessThan(
                OrderStatus.PAID, start.atStartOfDay(), end.plusDays(1).atStartOfDay()));
        bills.sort(Comparator.comparing(FoodOrder::getPaidAt).reversed());
        return bills;
    }

<<<<<<< HEAD
    /** Confirm a placed online order: only after it is paid, or when it is cash on delivery. Sends it to the kitchen. */
    @Transactional
    public FoodOrder accept(Long id) {
        FoodOrder o = get(id);
        requireConfirmable(o);
        boolean legacy = o.getPaymentStatus() == null; // saved before payments existed
        o.setStatus(OrderStatus.ACCEPTED);
        o.setKitchenStatus(KitchenStatus.PREPARING);
        if (!legacy || o.getOnlineStatus() != null) {
            o.setOnlineStatus(OnlineOrderStatus.CONFIRMED);
        }
        return orderRepository.save(o);
    }

    /**
     * Online order delivery steps: CONFIRMED -> PREPARING -> READY -> OUT_FOR_DELIVERY -> DELIVERED.
     * (PLACED -> CONFIRMED is {@link #accept}; cancelling is {@link #cancel}.)
     */
    @Transactional
    public FoodOrder advanceOnline(Long id, OnlineOrderStatus to) {
        FoodOrder o = get(id);
        if (o.getOrderType() != OrderType.ONLINE) {
            throw new BadRequestException("This is not an online order");
        }
        if (to == OnlineOrderStatus.CONFIRMED) {
            return accept(id);
        }
        if (to == OnlineOrderStatus.CANCELLED) {
            return cancel(id);
        }
        if (o.getStatus() != OrderStatus.ACCEPTED) {
            throw new BadRequestException("Confirm the order first");
        }
        OnlineOrderStatus from = o.getOnlineStatus() != null ? o.getOnlineStatus() : OnlineOrderStatus.CONFIRMED;
        boolean ok = switch (to) {
            case PREPARING -> from == OnlineOrderStatus.CONFIRMED;
            case READY -> from == OnlineOrderStatus.CONFIRMED || from == OnlineOrderStatus.PREPARING;
            case OUT_FOR_DELIVERY -> from == OnlineOrderStatus.READY;
            case DELIVERED -> from == OnlineOrderStatus.OUT_FOR_DELIVERY;
            default -> false;
        };
        if (!ok) {
            throw new BadRequestException("Cannot move an order from " + label(from) + " to " + label(to));
        }
        switch (to) {
            case PREPARING -> o.setKitchenStatus(KitchenStatus.PREPARING);
            case READY -> o.setKitchenStatus(KitchenStatus.READY);
            case DELIVERED -> {
                if (o.getPaymentStatus() != PaymentStatus.PAID) {
                    // cash on delivery (or an old order): the money is collected now
                    paymentService.recordCounterPayment(o, PaymentMethod.CASH_ON_DELIVERY, null);
                }
                o.setDeliveredAt(LocalDateTime.now());
                o.setStatus(OrderStatus.PAID); // counts as a sale from now on
                o.setPaidAt(LocalDateTime.now());
            }
            default -> { }
        }
        o.setOnlineStatus(to);
        return orderRepository.save(o);
    }

    // ------------------------------------------------------------------ online: customer payment and tracking

    /** Customer pays (or switches to cash on delivery) for a placed online order. */
    @Transactional
    public TrackResponse pay(String trackingCode, PayRequest r) {
        FoodOrder o = byTrackingCode(trackingCode);
        if (o.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("This order was cancelled");
        }
        if (o.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("This order is already paid");
        }
        if (o.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("This order can no longer be paid online");
        }
        if (r.getMethod() == PaymentMethod.CASH_ON_DELIVERY) {
            o.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
            o.setPaymentStatus(PaymentStatus.PENDING);
            o.setPaymentUpdatedAt(LocalDateTime.now());
        } else {
            paymentService.payOnline(o, r.getMethod(), r.getUpiId(), Boolean.TRUE.equals(r.getSimulateFailure()));
        }
        orderRepository.save(o);
        return new TrackResponse(o, paymentService.history(o.getId()));
    }

    @Transactional(readOnly = true)
    public TrackResponse track(String trackingCode) {
        FoodOrder o = byTrackingCode(trackingCode);
        return new TrackResponse(o, paymentService.history(o.getId()));
    }

    // ------------------------------------------------------------------ online: staff list

    /** Online orders of the last few days, plus any that are still running (newest first). */
    @Transactional(readOnly = true)
    public List<FoodOrder> onlineOrders(int days) {
        LocalDateTime since = LocalDate.now().minusDays(Math.max(0, Math.min(days, 92))).atStartOfDay();
        return orderRepository.findOnlineSince(OrderType.ONLINE, since, Set.of(OrderStatus.PENDING, OrderStatus.ACCEPTED));
    }

    @Transactional(readOnly = true)
    public TrackResponse withPayments(Long id) {
        FoodOrder o = get(id);
        return new TrackResponse(o, paymentService.history(o.getId()));
    }

=======
    @Transactional
    public FoodOrder accept(Long id) {
        FoodOrder o = get(id);
        if (o.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Only a pending online order can be accepted");
        }
        o.setStatus(OrderStatus.ACCEPTED);
        o.setKitchenStatus(KitchenStatus.PREPARING);
<<<<<<< Updated upstream
        return orderRepository.save(o);
    }

    /** Kitchen marks a running order as made (READY) or sends it back to PREPARING. */
    @Transactional
    public FoodOrder setKitchenStatus(Long id, KitchenStatus status) {
        FoodOrder o = get(id);
        if (o.getStatus() != OrderStatus.OPEN && o.getStatus() != OrderStatus.ACCEPTED) {
            throw new BadRequestException("Only a running order in the kitchen can be updated");
        }
        o.setKitchenStatus(status);
=======
>>>>>>> Stashed changes
        return orderRepository.save(o);
    }

>>>>>>> origin/sakshi
    /** Kitchen: the order has been made. It is now "Ready for Serving/Shipping" and cannot go back to preparing. */
    @Transactional
    public FoodOrder markReady(Long id) {
        FoodOrder o = getRunning(id);
        if (o.getKitchenStatus() == KitchenStatus.READY) {
            throw new BadRequestException("This order is already ready for serving/shipping");
        }
        if (o.getKitchenStatus() == KitchenStatus.SENT_TO_BILLING) {
            throw new BadRequestException("This order has already been sent to billing");
        }
        o.setKitchenStatus(KitchenStatus.READY);
<<<<<<< HEAD
        if (o.getOrderType() == OrderType.ONLINE && o.getOnlineStatus() != null) {
            o.setOnlineStatus(OnlineOrderStatus.READY);
        }
=======
>>>>>>> origin/sakshi
        return orderRepository.save(o);
    }

    /** Captain: the ready order was served / shipped - hand it over to Billing for payment. */
    @Transactional
    public FoodOrder sendToBilling(Long id) {
        FoodOrder o = getRunning(id);
<<<<<<< HEAD
        if (o.getOrderType() == OrderType.ONLINE && o.getOnlineStatus() != null) {
            throw new BadRequestException("Online orders are not billed here - mark them Out for delivery, then Delivered");
        }
=======
>>>>>>> origin/sakshi
        if (o.getKitchenStatus() == KitchenStatus.SENT_TO_BILLING) {
            throw new BadRequestException("This order is already in billing");
        }
        if (o.getKitchenStatus() != KitchenStatus.READY) {
            throw new BadRequestException("Only an order the kitchen has marked Ready can be sent to billing");
        }
        o.setKitchenStatus(KitchenStatus.SENT_TO_BILLING);
<<<<<<< HEAD
        applyTotals(o); // the bill uses the current GST settings
=======
>>>>>>> origin/sakshi
        return orderRepository.save(o);
    }

    /** Billing: bill paid - the order now counts as a sale (for the day it was paid). */
    @Transactional
<<<<<<< HEAD
    public FoodOrder markPaid(Long id, BillPaymentRequest payment) {
=======
    public FoodOrder markPaid(Long id) {
>>>>>>> origin/sakshi
        FoodOrder o = getRunning(id);
        if (o.getKitchenStatus() != KitchenStatus.SENT_TO_BILLING) {
            throw new BadRequestException("The captain has not sent this order to billing yet");
        }
<<<<<<< HEAD
        PaymentMethod method = payment != null && payment.getMethod() != null ? payment.getMethod() : PaymentMethod.CASH;
        if (method == PaymentMethod.CASH_ON_DELIVERY) {
            throw new BadRequestException("Choose cash, UPI, card, net banking or wallet");
        }
        paymentService.recordCounterPayment(o, method, payment != null ? payment.getReference() : null);
        if (payment != null && payment.getCustomerName() != null && !payment.getCustomerName().isBlank()) {
            o.setCustomerName(payment.getCustomerName().trim().replaceAll(" +", " "));
        }
=======
>>>>>>> origin/sakshi
        o.setStatus(OrderStatus.PAID);
        o.setPaidAt(LocalDateTime.now());
        return orderRepository.save(o);
    }

    @Transactional
    public FoodOrder cancel(Long id) {
        FoodOrder o = get(id);
<<<<<<< HEAD
        requireCancellable(o);
        paymentService.refund(o, "Order cancelled - payment refunded");
        o.setStatus(OrderStatus.CANCELLED);
        if (o.getOrderType() == OrderType.ONLINE && o.getOnlineStatus() != null) {
            o.setOnlineStatus(OnlineOrderStatus.CANCELLED);
        }
        return orderRepository.save(o);
    }

    /**
     * A placed online order can be confirmed only after it is paid, or when it is cash on delivery
     * (orders saved before payments existed: always). Throws with the reason otherwise. Changes nothing.
     */
    public void requireConfirmable(FoodOrder o) {
        if (o.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Only a newly placed online order can be confirmed");
        }
        boolean legacy = o.getPaymentStatus() == null;
        boolean paid = o.getPaymentStatus() == PaymentStatus.PAID;
        boolean cod = o.getPaymentMethod() == PaymentMethod.CASH_ON_DELIVERY && o.getPaymentStatus() == PaymentStatus.PENDING;
        if (!legacy && !paid && !cod) {
            throw new BadRequestException(o.getPaymentStatus() == PaymentStatus.FAILED
                    ? "Payment failed for this order - it can be confirmed after the customer pays"
                    : "Payment pending - the order can be confirmed after the customer pays (or chooses cash on delivery)");
        }
    }

    /** An order can be cancelled while it is not closed and not out for delivery. Changes nothing. */
    public void requireCancellable(FoodOrder o) {
        if (o.getStatus() == OrderStatus.PAID || o.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("This order is already closed");
        }
        if (o.getOnlineStatus() == OnlineOrderStatus.OUT_FOR_DELIVERY) {
            throw new BadRequestException("The order is out for delivery and cannot be cancelled now");
        }
=======
        if (o.getStatus() == OrderStatus.PAID || o.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("This order is already closed");
        }
        o.setStatus(OrderStatus.CANCELLED);
        return orderRepository.save(o);
>>>>>>> origin/sakshi
    }

    // ------------------------------------------------------------------ helpers

    private FoodOrder get(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    /** A table / room order, or an accepted online order (one that is in the kitchen or being served). */
    private FoodOrder getRunning(Long id) {
        FoodOrder o = get(id);
        if (o.getStatus() != OrderStatus.OPEN && o.getStatus() != OrderStatus.ACCEPTED) {
            throw new BadRequestException("Only a running order can be updated");
        }
        return o;
    }

    private Optional<FoodOrder> findOpen(OrderType type, String number) {
        if (type == OrderType.TABLE) {
            try {
                return orderRepository.findFirstByOrderTypeAndTableNumberAndStatus(
                        type, Integer.valueOf(number.trim()), OrderStatus.OPEN);
            } catch (NumberFormatException e) {
                return Optional.empty();
            }
        }
        if (type == OrderType.ROOM) {
            return orderRepository.findFirstByOrderTypeAndRoomNumberAndStatus(type, number.trim(), OrderStatus.OPEN);
        }
        return Optional.empty();
    }

<<<<<<< HEAD
    private void validateTarget(OrderType type, String number, boolean adding) {
=======
    private void validateTarget(OrderType type, String number) {
>>>>>>> origin/sakshi
        if (type == OrderType.TABLE) {
            int n;
            try {
                n = Integer.parseInt(number);
            } catch (NumberFormatException e) {
                throw new BadRequestException("Table number must be a number");
            }
<<<<<<< HEAD
            if (adding) {
                tableService.requireUsable(n);
=======
            if (n < 1 || n > tableCount) {
                throw new BadRequestException("Table number must be between 1 and " + tableCount);
>>>>>>> origin/sakshi
            }
        } else if (roomRepository.findByRoomNumber(number).isEmpty()) {
            throw new ResourceNotFoundException("Room " + number + " not found");
        }
    }

<<<<<<< HEAD
    private FoodOrder byTrackingCode(String code) {
        return orderRepository.findByTrackingCode(code == null ? "" : code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found. Please check your order link."));
    }

    private String newTrackingCode() {
        String code;
        do {
            code = "HS" + DemoPaymentGateway.random(18);
        } while (orderRepository.findByTrackingCode(code).isPresent());
        return code;
    }

    private static String label(OnlineOrderStatus s) {
        return s.name().replace('_', ' ').toLowerCase();
    }

=======
>>>>>>> origin/sakshi
    private void requireAvailable(MenuItem item) {
        if (!Boolean.TRUE.equals(item.getAvailable())) {
            throw new BadRequestException(item.getName() + " is not available right now");
        }
    }

<<<<<<< HEAD
    /** Item total (without GST) and the restaurant GST on it - computed once and stored on the order. */
    private void applyTotals(FoodOrder order) {
        order.setTotal(computeTotal(order));
        order.applyTax(GstService.calculate(order.getTotal(), gstService.foodRate()));
    }

=======
>>>>>>> origin/sakshi
    private BigDecimal computeTotal(FoodOrder order) {
        BigDecimal total = BigDecimal.ZERO;
        for (OrderLine l : order.getLines()) {
            total = total.add(l.getUnitPrice().multiply(BigDecimal.valueOf(l.getQuantity())));
        }
        return total;
    }

    /** What we return when the last item was removed (nothing is stored). */
    private FoodOrder empty(OrderType type, String number) {
        return FoodOrder.builder()
                .orderType(type)
                .tableNumber(type == OrderType.TABLE ? Integer.valueOf(number) : null)
                .roomNumber(type == OrderType.ROOM ? number : null)
                .build();
    }
}

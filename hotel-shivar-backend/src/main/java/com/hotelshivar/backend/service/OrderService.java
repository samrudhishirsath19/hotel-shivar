package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.AdjustOrderRequest;
import com.hotelshivar.backend.dto.OnlineOrderRequest;
import com.hotelshivar.backend.dto.OrderBoard;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.MenuItem;
import com.hotelshivar.backend.entity.OrderLine;
import com.hotelshivar.backend.entity.enums.KitchenStatus;
import com.hotelshivar.backend.entity.enums.OrderStatus;
import com.hotelshivar.backend.entity.enums.OrderType;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.FoodOrderRepository;
import com.hotelshivar.backend.repository.MenuItemRepository;
import com.hotelshivar.backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.restaurant.table-count:5}")
    private int tableCount;

    public int getTableCount() {
        return tableCount;
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
        validateTarget(type, number);

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
        order.setTotal(computeTotal(order));
        order.setKitchenStatus(KitchenStatus.PREPARING); // new / changed items must be made
        return orderRepository.save(order);
    }

    /** A customer's online order. Waits as PENDING until the manager accepts it. */
    @Transactional
    public FoodOrder placeOnline(OnlineOrderRequest r) {
        Map<Long, Integer> wanted = new LinkedHashMap<>();
        for (OnlineOrderRequest.Item i : r.getItems()) {
            wanted.merge(i.getMenuItemId(), i.getQuantity(), Integer::sum);
        }

        FoodOrder order = FoodOrder.builder()
                .orderType(OrderType.ONLINE)
                .customerName(r.getCustomerName().trim())
                .customerPhone(r.getCustomerPhone().trim())
                .status(OrderStatus.PENDING)
                .build();

        for (Map.Entry<Long, Integer> e : wanted.entrySet()) {
            MenuItem item = menuItemRepository.findById(e.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + e.getKey()));
            requireAvailable(item);
            order.getLines().add(new OrderLine(item.getId(), item.getName(), item.getPrice(), e.getValue()));
        }
        order.setTotal(computeTotal(order));
        return orderRepository.save(order);
    }

    // ------------------------------------------------------------------ staff side

    @Transactional(readOnly = true)
    public OrderBoard board() {
        List<FoodOrder> running = orderRepository.findByStatusInOrderByCreatedAtAsc(
                Set.of(OrderStatus.OPEN, OrderStatus.PENDING, OrderStatus.ACCEPTED));

        Map<Integer, FoodOrder> byTable = new LinkedHashMap<>();
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
        for (int n = 1; n <= tableCount; n++) {
            tables.add(new OrderBoard.TableSlot(n, byTable.get(n)));
        }
        return new OrderBoard(tableCount, tables, rooms, online);
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

    @Transactional
    public FoodOrder accept(Long id) {
        FoodOrder o = get(id);
        if (o.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Only a pending online order can be accepted");
        }
        o.setStatus(OrderStatus.ACCEPTED);
        o.setKitchenStatus(KitchenStatus.PREPARING);
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
        return orderRepository.save(o);
    }

    /** Bill paid - the order now counts as a sale (for the day it was paid). */
    @Transactional
    public FoodOrder markPaid(Long id) {
        FoodOrder o = get(id);
        if (o.getStatus() != OrderStatus.OPEN && o.getStatus() != OrderStatus.ACCEPTED) {
            throw new BadRequestException("Only a running order can be marked as paid");
        }
        o.setStatus(OrderStatus.PAID);
        o.setPaidAt(LocalDateTime.now());
        return orderRepository.save(o);
    }

    @Transactional
    public FoodOrder cancel(Long id) {
        FoodOrder o = get(id);
        if (o.getStatus() == OrderStatus.PAID || o.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("This order is already closed");
        }
        o.setStatus(OrderStatus.CANCELLED);
        return orderRepository.save(o);
    }

    // ------------------------------------------------------------------ helpers

    private FoodOrder get(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
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

    private void validateTarget(OrderType type, String number) {
        if (type == OrderType.TABLE) {
            int n;
            try {
                n = Integer.parseInt(number);
            } catch (NumberFormatException e) {
                throw new BadRequestException("Table number must be a number");
            }
            if (n < 1 || n > tableCount) {
                throw new BadRequestException("Table number must be between 1 and " + tableCount);
            }
        } else if (roomRepository.findByRoomNumber(number).isEmpty()) {
            throw new ResourceNotFoundException("Room " + number + " not found");
        }
    }

    private void requireAvailable(MenuItem item) {
        if (!Boolean.TRUE.equals(item.getAvailable())) {
            throw new BadRequestException(item.getName() + " is not available right now");
        }
    }

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

package com.hotelshivar.backend.config;

import com.hotelshivar.backend.entity.Booking;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.enums.BookingStatus;
import com.hotelshivar.backend.entity.enums.OrderStatus;
import com.hotelshivar.backend.repository.BookingRepository;
import com.hotelshivar.backend.repository.FoodOrderRepository;
import com.hotelshivar.backend.service.BookingService;
import com.hotelshivar.backend.service.GstService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * Records saved before GST existed have no GST figures. On start, GST is added ONCE to the ones that are
 * still open (unpaid orders, pending / confirmed bookings), so their bills come out with GST.
 * Paid orders and finished / cancelled bookings are never changed.
 */
@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class GstBackfill implements CommandLineRunner {

    private final FoodOrderRepository orderRepository;
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final GstService gstService;

    @Override
    @Transactional
    public void run(String... args) {
        int orders = 0;
        for (FoodOrder o : orderRepository.findByStatusInOrderByCreatedAtAsc(
                Set.of(OrderStatus.OPEN, OrderStatus.PENDING, OrderStatus.ACCEPTED))) {
            if (o.getGrandTotal() == null && o.getTotal() != null) {
                o.applyTax(GstService.calculate(o.getTotal(), gstService.foodRate()));
                orderRepository.save(o);
                orders++;
            }
        }
        int bookings = 0;
        for (Booking b : bookingRepository.findAll()) {
            if (b.getGrandTotal() == null && (b.getStatus() == BookingStatus.PENDING || b.getStatus() == BookingStatus.CONFIRMED)) {
                bookingService.applyRoomTax(b);
                bookingRepository.save(b);
                bookings++;
            }
        }
        if (orders + bookings > 0) {
            log.info("GST added to {} open orders and {} open bookings", orders, bookings);
        }
    }
}

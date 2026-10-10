package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.SalesReport;
import com.hotelshivar.backend.entity.Booking;
import com.hotelshivar.backend.entity.FoodOrder;
import com.hotelshivar.backend.entity.OrderLine;
import com.hotelshivar.backend.entity.enums.BookingStatus;
import com.hotelshivar.backend.entity.enums.OrderStatus;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.repository.BookingRepository;
import com.hotelshivar.backend.repository.FoodOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * Day-wise sales.
 *  - Food sales: orders marked PAID, counted on the day they were paid.
 *  - Room sales: CONFIRMED / COMPLETED bookings, counted on the day the booking was made,
 *    amount = number of nights x room price per night.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private static final Set<BookingStatus> COUNTED_BOOKINGS = Set.of(BookingStatus.CONFIRMED, BookingStatus.COMPLETED);

    private final FoodOrderRepository orderRepository;
    private final BookingRepository bookingRepository;

    /** Small mutable helper for adding things up. */
    private static class Agg {
        long quantity;
        long count;
        long nights;
        BigDecimal revenue = BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public SalesReport sales(LocalDate from, LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(6);
        if (start.isAfter(end)) {
            throw new BadRequestException("'From' date must not be after 'To' date");
        }
        if (ChronoUnit.DAYS.between(start, end) > 365) {
            throw new BadRequestException("Please choose a range of at most one year");
        }
        LocalDateTime startTime = start.atStartOfDay();
        LocalDateTime endTime = end.plusDays(1).atStartOfDay();

        Map<LocalDate, Agg> food = new TreeMap<>();
        Map<LocalDate, Agg> rooms = new TreeMap<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            food.put(d, new Agg());
            rooms.put(d, new Agg());
        }

        // ---- food
        Map<String, Agg> itemTotals = new HashMap<>();
        Map<LocalDate, Map<String, Agg>> itemsPerDay = new HashMap<>();
<<<<<<< HEAD
        BigDecimal foodGst = BigDecimal.ZERO;
        BigDecimal roomGst = BigDecimal.ZERO;
=======
>>>>>>> origin/sakshi
        List<FoodOrder> paid = orderRepository.findByStatusAndPaidAtGreaterThanEqualAndPaidAtLessThan(
                OrderStatus.PAID, startTime, endTime);
        for (FoodOrder o : paid) {
            LocalDate day = o.getPaidAt().toLocalDate();
            Agg dayAgg = food.get(day);
            dayAgg.count++;
<<<<<<< HEAD
            dayAgg.revenue = dayAgg.revenue.add(o.getTotal()); // sales are counted without GST
            if (o.getTaxAmount() != null) {
                foodGst = foodGst.add(o.getTaxAmount());
            }
=======
            dayAgg.revenue = dayAgg.revenue.add(o.getTotal());
>>>>>>> origin/sakshi
            for (OrderLine l : o.getLines()) {
                BigDecimal lineRevenue = l.getUnitPrice().multiply(BigDecimal.valueOf(l.getQuantity()));
                add(itemTotals, l.getName(), l.getQuantity(), lineRevenue);
                add(itemsPerDay.computeIfAbsent(day, k -> new HashMap<>()), l.getName(), l.getQuantity(), lineRevenue);
            }
        }

        // ---- rooms
        Map<String, Agg> roomTotals = new HashMap<>();
        List<Booking> bookings = bookingRepository.findForReport(COUNTED_BOOKINGS, startTime, endTime);
        for (Booking b : bookings) {
            LocalDate day = b.getCreatedAt().toLocalDate();
            long nights = Math.max(1, ChronoUnit.DAYS.between(b.getCheckIn(), b.getCheckOut()));
<<<<<<< HEAD
            BigDecimal amount = b.getRoomCharges() != null
                    ? b.getRoomCharges()
                    : b.getRoom().getPricePerNight().multiply(BigDecimal.valueOf(nights));
            if (b.getTaxAmount() != null) {
                roomGst = roomGst.add(b.getTaxAmount());
            }
=======
            BigDecimal amount = b.getRoom().getPricePerNight().multiply(BigDecimal.valueOf(nights));
>>>>>>> origin/sakshi

            Agg dayAgg = rooms.get(day);
            dayAgg.count++;
            dayAgg.revenue = dayAgg.revenue.add(amount);

            String label = (b.getRoom().getName() != null && !b.getRoom().getName().isBlank())
                    ? b.getRoom().getName() + " (" + b.getRoom().getRoomNumber() + ")"
                    : "Room " + b.getRoom().getRoomNumber();
            Agg roomAgg = roomTotals.computeIfAbsent(label, k -> new Agg());
            roomAgg.count++;
            roomAgg.nights += nights;
            roomAgg.revenue = roomAgg.revenue.add(amount);
        }

        // ---- assemble
        List<SalesReport.DayRow> days = new ArrayList<>();
        BigDecimal foodSum = BigDecimal.ZERO;
        BigDecimal roomSum = BigDecimal.ZERO;
        int orderCount = 0;
        int bookingCount = 0;
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            Agg f = food.get(d);
            Agg r = rooms.get(d);
            days.add(new SalesReport.DayRow(d, f.revenue, r.revenue, f.revenue.add(r.revenue),
                    (int) f.count, (int) r.count));
            foodSum = foodSum.add(f.revenue);
            roomSum = roomSum.add(r.revenue);
            orderCount += f.count;
            bookingCount += r.count;
        }

        Map<String, List<SalesReport.ItemRow>> byDay = new LinkedHashMap<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            Map<String, Agg> m = itemsPerDay.get(d);
            if (m != null) {
                byDay.put(d.toString(), itemRows(m));
            }
        }

        List<SalesReport.RoomRow> roomRows = new ArrayList<>();
        roomTotals.forEach((label, a) -> roomRows.add(new SalesReport.RoomRow(label, (int) a.count, a.nights, a.revenue)));
        roomRows.sort(Comparator.comparing(SalesReport.RoomRow::revenue).reversed());

<<<<<<< HEAD
        SalesReport.Totals totals = new SalesReport.Totals(foodSum, roomSum, foodSum.add(roomSum), orderCount, bookingCount,
                foodGst, roomGst, foodGst.add(roomGst));
=======
        SalesReport.Totals totals = new SalesReport.Totals(foodSum, roomSum, foodSum.add(roomSum), orderCount, bookingCount);
>>>>>>> origin/sakshi
        return new SalesReport(start, end, totals, days, itemRows(itemTotals), byDay, roomRows);
    }

    private static void add(Map<String, Agg> map, String name, long quantity, BigDecimal revenue) {
        Agg a = map.computeIfAbsent(name, k -> new Agg());
        a.quantity += quantity;
        a.revenue = a.revenue.add(revenue);
    }

    private static List<SalesReport.ItemRow> itemRows(Map<String, Agg> map) {
        List<SalesReport.ItemRow> rows = new ArrayList<>();
        map.forEach((name, a) -> rows.add(new SalesReport.ItemRow(name, a.quantity, a.revenue)));
        rows.sort(Comparator.comparing(SalesReport.ItemRow::revenue).reversed());
        return rows;
    }
}

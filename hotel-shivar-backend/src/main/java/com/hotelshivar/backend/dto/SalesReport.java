package com.hotelshivar.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record SalesReport(LocalDate from,
                          LocalDate to,
                          Totals totals,
                          List<DayRow> days,
                          List<ItemRow> items,
                          Map<String, List<ItemRow>> itemsByDay,
                          List<RoomRow> rooms) {

<<<<<<< HEAD
    /** Sales are without GST; foodGst / roomGst / gst = GST collected on them (shown separately). */
    public record Totals(BigDecimal food, BigDecimal rooms, BigDecimal total, int orders, int bookings,
                         BigDecimal foodGst, BigDecimal roomGst, BigDecimal gst) { }
=======
    public record Totals(BigDecimal food, BigDecimal rooms, BigDecimal total, int orders, int bookings) { }
>>>>>>> origin/sakshi

    public record DayRow(LocalDate date, BigDecimal food, BigDecimal rooms, BigDecimal total, int orders, int bookings) { }

    public record ItemRow(String name, long quantity, BigDecimal revenue) { }

    public record RoomRow(String room, int bookings, long nights, BigDecimal revenue) { }
}

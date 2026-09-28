package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.BookingRequest;
import com.hotelshivar.backend.entity.Booking;
import com.hotelshivar.backend.entity.enums.BookingStatus;
import com.hotelshivar.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping
    public List<Booking> getBookings(@RequestParam(required = false) String email) {
        return (email == null || email.isBlank())
                ? bookingService.getAllBookings()
                : bookingService.getBookingsByEmail(email);
    }

    @GetMapping("/{id}")
    public Booking getBooking(@PathVariable Long id) {
        return bookingService.getBookingById(id);
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody BookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request));
    }

    @PatchMapping("/{id}/status")
    public Booking updateStatus(@PathVariable Long id, @RequestParam BookingStatus status) {
        return bookingService.updateStatus(id, status);
    }

    @PatchMapping("/{id}/cancel")
    public Booking cancelBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id);
        return bookingService.getBookingById(id);
    }
}

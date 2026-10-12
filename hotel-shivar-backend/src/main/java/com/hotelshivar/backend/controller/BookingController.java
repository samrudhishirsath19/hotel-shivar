package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.BookingRequest;
import com.hotelshivar.backend.entity.Booking;
import com.hotelshivar.backend.entity.enums.BookingStatus;
import com.hotelshivar.backend.service.BookingService;
import com.hotelshivar.backend.entity.CustomerAccount;
import com.hotelshivar.backend.security.AuthInterceptor;

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

    @GetMapping("/{id:[0-9]+}")
    public Booking getBooking(@PathVariable Long id) {
        return bookingService.getBookingById(id);
    }

    /** Public. When a customer is logged in on the website, the booking is added to their account. */
    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody BookingRequest request,
            @RequestAttribute(value = AuthInterceptor.CUSTOMER_ATTRIBUTE, required = false) CustomerAccount customer) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.createBooking(request, customer != null ? customer.getId() : null));
    }

    /** Public: the customer's booking tracking page (secret code from the confirmation). */
    @GetMapping("/track/{code}")
    public Booking track(@PathVariable String code) {
        return bookingService.track(code);
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

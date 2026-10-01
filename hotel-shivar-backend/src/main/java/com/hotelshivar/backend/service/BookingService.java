package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.BookingRequest;
import com.hotelshivar.backend.entity.Booking;
import com.hotelshivar.backend.entity.Room;
import com.hotelshivar.backend.entity.enums.BookingStatus;
import com.hotelshivar.backend.exception.BookingConflictException;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.BookingRepository;
import com.hotelshivar.backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    public List<Booking> getBookingsByEmail(String email) {
        return bookingRepository.findByEmailIgnoreCase(email);
    }

    public Booking createBooking(BookingRequest request) {
        if (!request.getCheckOut().isAfter(request.getCheckIn())) {
            throw new BookingConflictException("Check-out date must be after check-in date");
        }

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + request.getRoomId()));

        if (!Boolean.TRUE.equals(room.getAvailable())) {
            throw new BookingConflictException("Room " + room.getRoomNumber() + " is not available for booking");
        }

        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                room.getId(), request.getCheckIn(), request.getCheckOut());
        if (!overlapping.isEmpty()) {
            throw new BookingConflictException(
                    "Room " + room.getRoomNumber() + " is already booked for the selected dates");
        }

        Booking booking = Booking.builder()
                .room(room)
                .guestName(request.getGuestName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .checkIn(request.getCheckIn())
                .checkOut(request.getCheckOut())
                .numberOfGuests(request.getNumberOfGuests())
                .specialRequests(request.getSpecialRequests())
                .status(BookingStatus.PENDING)
                .build();

        return bookingRepository.save(booking);
    }

    public Booking updateStatus(Long id, BookingStatus status) {
        Booking booking = getBookingById(id);
        booking.setStatus(status);
        bookingRepository.save(booking);
        // Read it again: save() hands back a copy whose room is a lazy proxy, and the JSON response
        // cannot load it after the database session is closed ("could not initialize proxy ... no Session").
        return getBookingById(id);
    }

    public void cancelBooking(Long id) {
        Booking booking = getBookingById(id);
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }
}

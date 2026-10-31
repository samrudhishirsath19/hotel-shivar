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
    private final GstService gstService;
    private final OfferService offerService;
    private final EmailNotifier emailNotifier;

    /** Public tracking page for a booking (secret code from the confirmation). */
    public Booking track(String code) {
        return bookingRepository.findByTrackingCode(code == null ? "" : code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found. Please check your booking link."));
    }

    private String newTrackingCode() {
        String code;
        do {
            code = "BK" + com.hotelshivar.backend.payment.DemoPaymentGateway.random(18);
        } while (bookingRepository.findByTrackingCode(code).isPresent());
        return code;
    }

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
        return createBooking(request, null);
    }

    /** customerId = logged-in customer account (null for a guest booking). */
    public Booking createBooking(BookingRequest request, Long customerId) {
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
                .customerId(customerId)
                .trackingCode(newTrackingCode())
                .build();

        // offer: the code the guest typed, or else the best live offer for this stay (applied automatically);
        // checked against the room charges and taken off before GST
        int nights = (int) Math.max(1, java.time.temporal.ChronoUnit.DAYS.between(request.getCheckIn(), request.getCheckOut()));
        java.math.BigDecimal charges = room.getPricePerNight().multiply(java.math.BigDecimal.valueOf(nights));
        OfferService.Quote offer = offerService.codeOrBest(request.getOfferCode(), OfferService.Channel.ROOM, charges, nights, request.getCheckIn());
        if (offer != null) {
            booking.setOfferCode(offer.offer().getCode());
            booking.setOfferTitle(offer.offer().getTitle());
            booking.setDiscountAmount(offer.discount());
        }
        applyRoomTax(booking);

        Booking saved = bookingRepository.save(booking);
        if (offer != null) {
            offerService.recordUse(offer.offer());
        }
        emailNotifier.bookingPlaced(saved);
        return saved;
    }

    /**
     * Reception desk: apply an offer to a booking (blank code = remove it). The room GST is worked out again
     * on the amount after the discount. A cancelled booking cannot be changed.
     */
    @org.springframework.transaction.annotation.Transactional
    public Booking applyOffer(Long id, String code) {
        Booking b = getBookingById(id);
        if (b.getStatus() == BookingStatus.CANCELLED) {
            throw new com.hotelshivar.backend.exception.BadRequestException("This booking is cancelled");
        }
        String before = b.getOfferCode();
        int nights = (int) Math.max(1, java.time.temporal.ChronoUnit.DAYS.between(b.getCheckIn(), b.getCheckOut()));
        java.math.BigDecimal charges = b.getRoom().getPricePerNight().multiply(java.math.BigDecimal.valueOf(nights));
        OfferService.Quote q = null;
        if (code == null || code.isBlank()) {
            b.setOfferCode(null);
            b.setOfferTitle(null);
            b.setDiscountAmount(null);
        } else {
            q = offerService.requireForBooking(code, charges, nights, b.getCheckIn(),
                    b.getCreatedAt() != null ? b.getCreatedAt().toLocalDate() : null);
            b.setOfferCode(q.offer().getCode());
            b.setOfferTitle(q.offer().getTitle());
            b.setDiscountAmount(q.discount());
        }
        applyRoomTax(b);
        bookingRepository.save(b);
        if (q != null && !q.offer().getCode().equals(before)) {
            offerService.recordUse(q.offer());
        }
        return getBookingById(id);
    }

    public Booking updateStatus(Long id, BookingStatus status) {
        Booking booking = getBookingById(id);
        boolean cancelling = status == BookingStatus.CANCELLED && booking.getStatus() != BookingStatus.CANCELLED;
        booking.setStatus(status);
        bookingRepository.save(booking);
        if (cancelling) {
            emailNotifier.bookingCancelled(booking);
        }
        // Read it again: save() hands back a copy whose room is a lazy proxy, and the JSON response
        // cannot load it after the database session is closed ("could not initialize proxy ... no Session").
        return getBookingById(id);
    }

    public void cancelBooking(Long id) {
        Booking booking = getBookingById(id);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            return; // already cancelled: no second email
        }
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        emailNotifier.bookingCancelled(booking);
    }

    /**
     * Room charges = nights x price per night, plus room GST. The GST % depends on the price of ONE room
     * for ONE night (up to the limit / above it), not on the total of the stay. Worked out once and stored.
     */
    public void applyRoomTax(Booking b) {
        int nights = (int) Math.max(1, java.time.temporal.ChronoUnit.DAYS.between(b.getCheckIn(), b.getCheckOut()));
        java.math.BigDecimal perNight = b.getRoom().getPricePerNight();
        b.setNights(nights);
        b.setRoomCharges(perNight.multiply(java.math.BigDecimal.valueOf(nights)));
        // an offer discount comes off first; GST is on what the guest actually pays, and the GST slab is
        // decided by that price per night
        java.math.BigDecimal discount = b.getDiscountAmount() != null ? b.getDiscountAmount().min(b.getRoomCharges()) : java.math.BigDecimal.ZERO;
        java.math.BigDecimal taxable = b.getRoomCharges().subtract(discount);
        java.math.BigDecimal effectivePerNight = taxable.divide(java.math.BigDecimal.valueOf(nights), 2, java.math.RoundingMode.HALF_UP);
        b.applyTax(GstService.calculate(taxable, gstService.roomRate(effectivePerNight)));
    }
}

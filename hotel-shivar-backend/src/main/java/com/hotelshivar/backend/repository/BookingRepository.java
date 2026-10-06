package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.Booking;
import com.hotelshivar.backend.entity.enums.BookingStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    // The room is loaded together with the booking (open-in-view is off, so lazy loading would fail in JSON).
    @Override
    @EntityGraph(attributePaths = "room")
    List<Booking> findAll();

    @Override
    @EntityGraph(attributePaths = "room")
    Optional<Booking> findById(Long id);

    @EntityGraph(attributePaths = "room")
    List<Booking> findByEmailIgnoreCase(String email);

    /** Ids of rooms that have a live (pending / confirmed) booking overlapping the dates. */
    @Query("""
           select distinct b.room.id from Booking b
           where b.status in (com.hotelshivar.backend.entity.enums.BookingStatus.PENDING,
                              com.hotelshivar.backend.entity.enums.BookingStatus.CONFIRMED)
           and b.checkIn < :checkOut
           and b.checkOut > :checkIn
           """)
    List<Long> findOccupiedRoomIds(@Param("checkIn") LocalDate checkIn, @Param("checkOut") LocalDate checkOut);

    @Query("""
           select b from Booking b
           where b.room.id = :roomId
           and b.status in (com.hotelshivar.backend.entity.enums.BookingStatus.PENDING,
                            com.hotelshivar.backend.entity.enums.BookingStatus.CONFIRMED)
           and b.checkIn < :checkOut
           and b.checkOut > :checkIn
           """)
    List<Booking> findOverlappingBookings(@Param("roomId") Long roomId,
                                           @Param("checkIn") LocalDate checkIn,
                                           @Param("checkOut") LocalDate checkOut);

    @Query("""
           select b from Booking b join fetch b.room
           where b.status in :statuses
           and b.createdAt >= :from
           and b.createdAt < :to
           """)
    List<Booking> findForReport(@Param("statuses") Collection<BookingStatus> statuses,
                                @Param("from") LocalDateTime from,
                                @Param("to") LocalDateTime to);
}

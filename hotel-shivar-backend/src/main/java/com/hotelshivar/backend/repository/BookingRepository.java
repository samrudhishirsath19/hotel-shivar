package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByEmailIgnoreCase(String email);

    @Query("""
           select b from Booking b
           where b.room.id = :roomId
           and b.status <> com.hotelshivar.backend.entity.enums.BookingStatus.CANCELLED
           and b.checkIn < :checkOut
           and b.checkOut > :checkIn
           """)
    List<Booking> findOverlappingBookings(@Param("roomId") Long roomId,
                                           @Param("checkIn") LocalDate checkIn,
                                           @Param("checkOut") LocalDate checkOut);
}

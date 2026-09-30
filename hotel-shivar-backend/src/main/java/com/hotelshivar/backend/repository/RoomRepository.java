package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.Room;
import com.hotelshivar.backend.entity.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByAvailableTrue();
    List<Room> findByType(RoomType type);
    Optional<Room> findByRoomNumber(String roomNumber);
}

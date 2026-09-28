package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.RoomRequest;
import com.hotelshivar.backend.entity.Room;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public List<Room> getAvailableRooms() {
        return roomRepository.findByAvailableTrue();
    }

    public Room getRoomById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));
    }

    public Room createRoom(RoomRequest request) {
        Room room = Room.builder()
                .roomNumber(request.getRoomNumber())
                .type(request.getType())
                .pricePerNight(request.getPricePerNight())
                .description(request.getDescription())
                .capacity(request.getCapacity())
                .imageUrl(request.getImageUrl())
                .available(request.getAvailable() == null || request.getAvailable())
                .build();
        return roomRepository.save(room);
    }

    public Room updateRoom(Long id, RoomRequest request) {
        Room room = getRoomById(id);
        room.setRoomNumber(request.getRoomNumber());
        room.setType(request.getType());
        room.setPricePerNight(request.getPricePerNight());
        room.setDescription(request.getDescription());
        room.setCapacity(request.getCapacity());
        room.setImageUrl(request.getImageUrl());
        if (request.getAvailable() != null) {
            room.setAvailable(request.getAvailable());
        }
        return roomRepository.save(room);
    }

    public void deleteRoom(Long id) {
        Room room = getRoomById(id);
        roomRepository.delete(room);
    }
}

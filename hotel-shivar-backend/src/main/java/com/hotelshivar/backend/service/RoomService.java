package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.RoomRequest;
import com.hotelshivar.backend.entity.Room;
import com.hotelshivar.backend.exception.BadRequestException;
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
        String number = request.getRoomNumber().trim();
        if (roomRepository.findByRoomNumber(number).isPresent()) {
            throw new BadRequestException("Room number " + number + " already exists. Use a different room number.");
        }
        Room room = Room.builder()
                .roomNumber(number)
                .name(request.getName().trim())
                .type(request.getType())
                .pricePerNight(request.getPricePerNight())
                .description(request.getDescription())
                .size(request.getSize())
                .capacity(request.getCapacity())
                .amenities(request.getAmenities())
                .imageUrl(request.getImageUrl())
                .available(request.getAvailable() == null || request.getAvailable())
                .build();
        return roomRepository.save(room);
    }

    public Room updateRoom(Long id, RoomRequest request) {
        Room room = getRoomById(id);
        String number = request.getRoomNumber().trim();
        roomRepository.findByRoomNumber(number).ifPresent(other -> {
            if (!other.getId().equals(id)) {
                throw new BadRequestException("Room number " + number + " already exists. Use a different room number.");
            }
        });
        room.setRoomNumber(number);
        room.setName(request.getName().trim());
        room.setType(request.getType());
        room.setPricePerNight(request.getPricePerNight());
        room.setDescription(request.getDescription());
        room.setSize(request.getSize());
        room.setCapacity(request.getCapacity());
        room.setAmenities(request.getAmenities());
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

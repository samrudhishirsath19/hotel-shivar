package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.RoomRequest;
import com.hotelshivar.backend.entity.Room;
import com.hotelshivar.backend.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    public List<Room> getRooms(@RequestParam(required = false) Boolean availableOnly) {
        return Boolean.TRUE.equals(availableOnly)
                ? roomService.getAvailableRooms()
                : roomService.getAllRooms();
    }

    @GetMapping("/{id}")
    public Room getRoom(@PathVariable Long id) {
        return roomService.getRoomById(id);
    }

    @PostMapping
    public ResponseEntity<Room> createRoom(@Valid @RequestBody RoomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roomService.createRoom(request));
    }

    @PutMapping("/{id}")
    public Room updateRoom(@PathVariable Long id, @Valid @RequestBody RoomRequest request) {
        return roomService.updateRoom(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }
}

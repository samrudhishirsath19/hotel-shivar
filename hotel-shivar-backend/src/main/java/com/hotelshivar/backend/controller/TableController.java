package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.TableRequest;
import com.hotelshivar.backend.entity.RestaurantTable;
import com.hotelshivar.backend.entity.enums.TableStatus;
import com.hotelshivar.backend.service.TableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Restaurant tables. Who may read / set up / change status: Module Access permissions (see AccessPolicy). */
@RestController
@RequestMapping("/api/admin/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    @GetMapping
    public List<RestaurantTable> list() {
        return tableService.list();
    }

    @PostMapping
    public ResponseEntity<RestaurantTable> create(@Valid @RequestBody TableRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tableService.create(request));
    }

    @PutMapping("/{id}")
    public RestaurantTable update(@PathVariable Long id, @Valid @RequestBody TableRequest request) {
        return tableService.update(id, request);
    }

    /** Change only the status (Table status permission). */
    @PatchMapping("/{id}/status")
    public RestaurantTable setStatus(@PathVariable Long id, @RequestParam TableStatus status) {
        return tableService.setStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tableService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

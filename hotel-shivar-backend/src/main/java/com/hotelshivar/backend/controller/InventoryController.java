package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.InventoryRequest;
import com.hotelshivar.backend.entity.InventoryItem;
import com.hotelshivar.backend.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Super admin only (anything not listed in AccessPolicy is super admin only). */
@RestController
@RequestMapping("/api/admin/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService service;

    @GetMapping
    public List<InventoryItem> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<InventoryItem> create(@Valid @RequestBody InventoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public InventoryItem update(@PathVariable Long id, @Valid @RequestBody InventoryRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.StaffRequest;
import com.hotelshivar.backend.entity.StaffMember;
import com.hotelshivar.backend.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Super admin only. */
@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService service;

    @GetMapping
    public List<StaffMember> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<StaffMember> create(@Valid @RequestBody StaffRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public StaffMember update(@PathVariable Long id, @Valid @RequestBody StaffRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

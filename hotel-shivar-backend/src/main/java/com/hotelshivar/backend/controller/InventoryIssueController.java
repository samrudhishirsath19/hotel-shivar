package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.InventoryIssueRequest;
import com.hotelshivar.backend.entity.AdminUser;
import com.hotelshivar.backend.entity.InventoryIssue;
import com.hotelshivar.backend.security.AuthInterceptor;
import com.hotelshivar.backend.service.InventoryIssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Inventory Out (stock issued from the store). Dates are yyyy-MM-dd; with no dates you get the last 30 days. */
@RestController
@RequestMapping("/api/admin/inventory-out")
@RequiredArgsConstructor
public class InventoryIssueController {

    private final InventoryIssueService service;

    @GetMapping
    public List<InventoryIssue> list(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.list(from, to);
    }

    @PostMapping
    public ResponseEntity<InventoryIssue> create(@Valid @RequestBody InventoryIssueRequest request,
                                                 @RequestAttribute(AuthInterceptor.USER_ATTRIBUTE) AdminUser me) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, me));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

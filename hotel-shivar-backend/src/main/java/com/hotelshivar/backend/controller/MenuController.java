package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.MenuItemRequest;
import com.hotelshivar.backend.entity.MenuItem;
import com.hotelshivar.backend.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    /** Public: what customers see on the Restaurant page (hidden items are left out). */
    @GetMapping("/menu")
    public List<MenuItem> available() {
        return menuService.getAvailable();
    }

    /** Super admin: every item including hidden ones. */
    @GetMapping("/admin/menu")
    public List<MenuItem> all() {
        return menuService.getAll();
    }

    @PostMapping("/menu")
    public ResponseEntity<MenuItem> create(@Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuService.create(request));
    }

    @PutMapping("/menu/{id}")
    public MenuItem update(@PathVariable Long id, @Valid @RequestBody MenuItemRequest request) {
        return menuService.update(id, request);
    }

    @DeleteMapping("/menu/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        menuService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

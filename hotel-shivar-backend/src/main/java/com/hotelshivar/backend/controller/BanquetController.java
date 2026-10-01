package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.BanquetRequest;
import com.hotelshivar.backend.entity.BanquetEnquiry;
import com.hotelshivar.backend.service.BanquetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/banquet")
@RequiredArgsConstructor
public class BanquetController {

    private final BanquetService banquetService;

    @PostMapping
    public ResponseEntity<BanquetEnquiry> submit(@Valid @RequestBody BanquetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(banquetService.submitEnquiry(request));
    }

    @GetMapping
    public List<BanquetEnquiry> getAll() {
        return banquetService.getAllEnquiries();
    }
}

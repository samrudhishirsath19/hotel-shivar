package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.dto.GalleryImageRequest;
import com.hotelshivar.backend.entity.GalleryImage;
import com.hotelshivar.backend.service.GalleryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gallery")
@RequiredArgsConstructor
public class GalleryController {

    private final GalleryService galleryService;

    @GetMapping
    public List<GalleryImage> getImages(@RequestParam(required = false) String category) {
        return (category == null || category.isBlank())
                ? galleryService.getAllImages()
                : galleryService.getImagesByCategory(category);
    }

    @PostMapping
    public ResponseEntity<GalleryImage> addImage(@Valid @RequestBody GalleryImageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(galleryService.addImage(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long id) {
        galleryService.deleteImage(id);
        return ResponseEntity.noContent().build();
    }
}

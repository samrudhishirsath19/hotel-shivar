package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.GalleryImageRequest;
import com.hotelshivar.backend.entity.GalleryImage;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.GalleryImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GalleryService {

    private final GalleryImageRepository galleryImageRepository;

    public List<GalleryImage> getAllImages() {
        return galleryImageRepository.findAll();
    }

    public List<GalleryImage> getImagesByCategory(String category) {
        return galleryImageRepository.findByCategoryIgnoreCase(category);
    }

    public GalleryImage addImage(GalleryImageRequest request) {
        GalleryImage image = GalleryImage.builder()
                .title(request.getTitle())
                .imageUrl(request.getImageUrl())
                .category(request.getCategory())
                .build();
        return galleryImageRepository.save(image);
    }

    public void deleteImage(Long id) {
        GalleryImage image = galleryImageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gallery image not found with id: " + id));
        galleryImageRepository.delete(image);
    }
}

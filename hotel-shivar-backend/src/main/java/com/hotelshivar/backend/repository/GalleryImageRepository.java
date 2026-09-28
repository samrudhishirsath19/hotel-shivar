package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.GalleryImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GalleryImageRepository extends JpaRepository<GalleryImage, Long> {
    List<GalleryImage> findByCategoryIgnoreCase(String category);
}

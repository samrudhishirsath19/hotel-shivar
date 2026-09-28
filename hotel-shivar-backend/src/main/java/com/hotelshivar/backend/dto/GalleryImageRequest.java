package com.hotelshivar.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GalleryImageRequest {

    private String title;

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    private String category;
}

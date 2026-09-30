package com.hotelshivar.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MenuItemRequest {

    @NotBlank(message = "Item name is required")
    @Size(max = 150, message = "Item name is too long")
    private String name;

    @NotBlank(message = "Category is required")
    @Size(max = 100, message = "Category is too long")
    private String category;

    @NotBlank(message = "Type is required")
    @Pattern(regexp = "veg|nonveg|common", message = "Type must be veg, nonveg or common")
    private String type;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @Size(max = 500, message = "Description is too long (max 500 characters)")
    private String description;

    @Size(max = 1000, message = "Image link is too long")
    private String imageUrl;

    private Boolean available;
}

package com.hotelshivar.backend.dto;

import com.hotelshivar.backend.entity.enums.RoomType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RoomRequest {

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotBlank(message = "Room name is required")
    private String name;

    @NotNull(message = "Room type is required")
    private RoomType type;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal pricePerNight;

    private String description;

    private String size;

    private Integer capacity;

    /** Comma separated list. */
    private String amenities;

    private String imageUrl;

    private Boolean available;
}

package com.hotelshivar.backend.dto;

import com.hotelshivar.backend.entity.enums.TableStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TableRequest {

    @NotNull(message = "Table number is required")
    @Min(value = 1, message = "Table number must be 1 or more")
    @Max(value = 999, message = "Table number is too large")
    private Integer tableNumber;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1 seat")
    @Max(value = 50, message = "Capacity is too large")
    private Integer capacity;

    /** AVAILABLE (default), RESERVED or OUT_OF_SERVICE. */
    private TableStatus status;
}

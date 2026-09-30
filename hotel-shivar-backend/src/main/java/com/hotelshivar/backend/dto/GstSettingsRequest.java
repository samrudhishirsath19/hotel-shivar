package com.hotelshivar.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class GstSettingsRequest {

    @NotNull(message = "Choose whether GST is charged")
    private Boolean enabled;

    @NotNull(message = "Food GST rate is required")
    @DecimalMin(value = "0", message = "Food GST rate cannot be negative")
    @DecimalMax(value = "28", message = "Food GST rate cannot be more than 28%")
    private BigDecimal foodRate;

    @NotNull(message = "Room GST rate (up to the limit) is required")
    @DecimalMin(value = "0", message = "Room GST rate cannot be negative")
    @DecimalMax(value = "28", message = "Room GST rate cannot be more than 28%")
    private BigDecimal roomRateLow;

    @NotNull(message = "Room GST rate (above the limit) is required")
    @DecimalMin(value = "0", message = "Room GST rate cannot be negative")
    @DecimalMax(value = "28", message = "Room GST rate cannot be more than 28%")
    private BigDecimal roomRateHigh;

    @NotNull(message = "Room price limit is required")
    @Positive(message = "Room price limit must be positive")
    private BigDecimal roomThreshold;

    /** 15-character GSTIN, e.g. 27ABCDE1234F1Z5 (optional). */
    @Pattern(regexp = "^ *$|^ *[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z] *$", flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "GSTIN must be 15 characters, e.g. 27ABCDE1234F1Z5")
    private String gstin;

    @Size(max = 150, message = "Business name is too long")
    private String legalName;

    @Size(max = 300, message = "Address is too long")
    private String address;

    @Pattern(regexp = "^$|^[0-9]{4,8}$", message = "SAC code must be 4 to 8 digits")
    private String sacFood;

    @Pattern(regexp = "^$|^[0-9]{4,8}$", message = "SAC code must be 4 to 8 digits")
    private String sacRoom;
}

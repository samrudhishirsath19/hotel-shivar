package com.hotelshivar.backend.dto;

import com.hotelshivar.backend.entity.Offer;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class OfferRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 120, message = "Title is too long")
    private String title;

    @Size(max = 2000, message = "Description is too long")
    private String description;

    /** Letters and digits, 3-20 characters, e.g. MONSOON20. Leave empty for a display-only offer. */
    @Pattern(regexp = "^ *$|^ *[A-Za-z0-9]{3,20} *$", message = "Code must be 3-20 letters or digits, e.g. MONSOON20")
    private String code;

    @NotNull(message = "Discount % is required")
    @Min(value = 1, message = "Discount must be at least 1%")
    @Max(value = 90, message = "Discount cannot be more than 90%")
    private Integer discountPercent;

    @DecimalMin(value = "1", message = "Maximum discount must be at least Rs 1")
    private BigDecimal maxDiscount;

    @DecimalMin(value = "0", message = "Minimum bill cannot be negative")
    private BigDecimal minAmount;

    @Min(value = 1, message = "Minimum nights must be at least 1")
    @Max(value = 60, message = "Minimum nights is too large")
    private Integer minNights;

    private Boolean weekdaysOnly;

    private Boolean weekendsOnly;

    @Min(value = 1, message = "Days before check-in must be at least 1")
    @Max(value = 365, message = "Days before check-in is too large")
    private Integer minDaysAhead;

    private java.time.LocalTime timeFrom;
    private java.time.LocalTime timeTo;

    @NotNull(message = "Choose where the offer applies")
    private Offer.AppliesTo appliesTo;

    private LocalDate validFrom;
    private LocalDate validTo;

    @Min(value = 1, message = "Usage limit must be at least 1")
    private Integer usageLimit;

    @Size(max = 1000, message = "Image link is too long")
    private String imageUrl;

    private Boolean active;
}

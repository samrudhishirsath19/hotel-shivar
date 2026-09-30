package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.GstSettingsRequest;
import com.hotelshivar.backend.entity.GstSettings;
import com.hotelshivar.backend.repository.GstSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Locale;

/**
 * GST rules. Prices are without GST; tax is worked out ONCE on the taxable amount and stored on the
 * order / booking, so it is never added twice. CGST and SGST are each half of the rate.
 */
@Service
@RequiredArgsConstructor
public class GstService {

    private static final long ID = 1L;
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final GstSettingsRepository repository;

    /** Tax on one bill. rate = total GST %, e.g. 5 -> 2.5% CGST + 2.5% SGST. */
    public record Tax(BigDecimal taxable, BigDecimal rate, BigDecimal cgst, BigDecimal sgst, BigDecimal tax, BigDecimal total) { }

    @Transactional
    public GstSettings settings() {
        return repository.findById(ID).orElseGet(() -> repository.save(GstSettings.builder().id(ID).build()));
    }

    @Transactional
    public GstSettings update(GstSettingsRequest r) {
        if (r.getRoomRateHigh().compareTo(r.getRoomRateLow()) < 0) {
            throw new com.hotelshivar.backend.exception.BadRequestException(
                    "The room rate above the limit should not be lower than the rate up to the limit");
        }
        GstSettings s = settings();
        s.setEnabled(r.getEnabled());
        s.setFoodRate(scale(r.getFoodRate()));
        s.setRoomRateLow(scale(r.getRoomRateLow()));
        s.setRoomRateHigh(scale(r.getRoomRateHigh()));
        s.setRoomThreshold(r.getRoomThreshold().setScale(2, RoundingMode.HALF_UP));
        s.setGstin(blankToNull(r.getGstin() == null ? null : r.getGstin().trim().toUpperCase(Locale.ROOT)));
        s.setLegalName(blankToNull(r.getLegalName()));
        s.setAddress(blankToNull(r.getAddress()));
        s.setSacFood(blankToNull(r.getSacFood()));
        s.setSacRoom(blankToNull(r.getSacRoom()));
        s.setUpdatedAt(LocalDateTime.now());
        return repository.save(s);
    }

    /** GST % for restaurant food (0 when GST is switched off). */
    public BigDecimal foodRate() {
        GstSettings s = settings();
        return Boolean.TRUE.equals(s.getEnabled()) ? s.getFoodRate() : BigDecimal.ZERO;
    }

    /** GST % for a room: decided by the price of ONE room for ONE night (up to the limit / above it). */
    public BigDecimal roomRate(BigDecimal pricePerNight) {
        GstSettings s = settings();
        if (!Boolean.TRUE.equals(s.getEnabled())) {
            return BigDecimal.ZERO;
        }
        return pricePerNight.compareTo(s.getRoomThreshold()) <= 0 ? s.getRoomRateLow() : s.getRoomRateHigh();
    }

    /** CGST and SGST are rounded to the paisa separately, then added. */
    public static Tax calculate(BigDecimal taxable, BigDecimal rate) {
        BigDecimal base = taxable.setScale(2, RoundingMode.HALF_UP);
        BigDecimal half = rate.divide(new BigDecimal("2"), 4, RoundingMode.HALF_UP);
        BigDecimal cgst = base.multiply(half).divide(HUNDRED, 2, RoundingMode.HALF_UP);
        BigDecimal sgst = cgst;
        BigDecimal tax = cgst.add(sgst);
        return new Tax(base, scale(rate), cgst, sgst, tax, base.add(tax));
    }

    private static BigDecimal scale(BigDecimal rate) {
        return rate.setScale(2, RoundingMode.HALF_UP);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}

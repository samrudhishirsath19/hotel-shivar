package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.OfferRequest;
import com.hotelshivar.backend.entity.Offer;
import com.hotelshivar.backend.exception.BadRequestException;
import com.hotelshivar.backend.exception.ResourceNotFoundException;
import com.hotelshivar.backend.repository.OfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class OfferService {

    private final OfferRepository offerRepository;

    /** An offer code checked against a bill: the discount, or why it cannot be used. */
    public record Quote(boolean valid, String message, Offer offer, BigDecimal discount) { }

    public List<Offer> getAllOffers() {
        return offerRepository.findAll();
    }

    /** What the Offers page shows: switched on and not expired. */
    public List<Offer> getActiveOffers() {
        LocalDate today = LocalDate.now();
        return offerRepository.findByActiveTrue().stream()
                .filter(o -> o.getValidTo() == null || !o.getValidTo().isBefore(today))
                .toList();
    }

    public Offer getOfferById(Long id) {
        return offerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found with id: " + id));
    }

    @Transactional
    public Offer createOffer(OfferRequest request) {
        Offer offer = new Offer();
        offer.setUsedCount(0);
        apply(offer, request);
        return offerRepository.save(offer);
    }

    @Transactional
    public Offer updateOffer(Long id, OfferRequest request) {
        Offer offer = getOfferById(id);
        apply(offer, request);
        return offerRepository.save(offer);
    }

    public void deleteOffer(Long id) {
        offerRepository.delete(getOfferById(id));
    }

    private void apply(Offer o, OfferRequest r) {
        String code = r.getCode() == null || r.getCode().isBlank() ? null : r.getCode().trim().toUpperCase(Locale.ROOT);
        if (code != null) {
            offerRepository.findByCodeIgnoreCase(code).ifPresent(other -> {
                if (!other.getId().equals(o.getId())) {
                    throw new BadRequestException("Offer code " + code + " is already used by \"" + other.getTitle() + "\"");
                }
            });
        }
        if (r.getValidFrom() != null && r.getValidTo() != null && r.getValidTo().isBefore(r.getValidFrom())) {
            throw new BadRequestException("'Valid till' must be on or after 'Valid from'");
        }
        o.setTitle(r.getTitle().trim());
        o.setDescription(r.getDescription());
        o.setCode(code);
        o.setDiscountPercent(r.getDiscountPercent());
        o.setMaxDiscount(r.getMaxDiscount());
        o.setMinAmount(r.getMinAmount());
        o.setMinNights(r.getMinNights());
        o.setWeekdaysOnly(Boolean.TRUE.equals(r.getWeekdaysOnly()));
        o.setAppliesTo(r.getAppliesTo());
        o.setValidFrom(r.getValidFrom());
        o.setValidTo(r.getValidTo());
        o.setUsageLimit(r.getUsageLimit());
        o.setImageUrl(r.getImageUrl() == null || r.getImageUrl().isBlank() ? null : r.getImageUrl().trim());
        o.setActive(r.getActive() == null || r.getActive());
        if (o.getUsedCount() == null) {
            o.setUsedCount(0);
        }
    }

    // ------------------------------------------------------------------ using a code

    /**
     * Checks a code against a bill. forRooms = room booking (nights / check-in matter) or food order.
     * amount = bill before discount and GST. Never throws - the result says why a code cannot be used.
     */
    public Quote quote(String rawCode, boolean forRooms, BigDecimal amount, int nights, LocalDate checkIn) {
        if (rawCode == null || rawCode.isBlank()) {
            return new Quote(false, "Enter an offer code", null, BigDecimal.ZERO);
        }
        String code = rawCode.trim().toUpperCase(Locale.ROOT);
        return quote(offerRepository.findByCodeIgnoreCase(code).orElse(null), code, forRooms, amount, nights, checkIn);
    }

    private Quote quote(Offer o, String code, boolean forRooms, BigDecimal amount, int nights, LocalDate checkIn) {
        LocalDate today = LocalDate.now();
        String why = null;
        if (o == null || !Boolean.TRUE.equals(o.getActive())) {
            why = "Offer code " + code + " is not valid";
        } else if (o.getValidFrom() != null && today.isBefore(o.getValidFrom())) {
            why = "This offer starts on " + o.getValidFrom();
        } else if (o.getValidTo() != null && today.isAfter(o.getValidTo())) {
            why = "This offer ended on " + o.getValidTo();
        } else if (o.getUsageLimit() != null && o.getUsedCount() != null && o.getUsedCount() >= o.getUsageLimit()) {
            why = "This offer has been fully used";
        } else if (forRooms && o.getAppliesTo() == Offer.AppliesTo.FOOD) {
            why = "This offer is for food orders only";
        } else if (!forRooms && o.getAppliesTo() == Offer.AppliesTo.ROOMS) {
            why = "This offer is for room bookings only";
        } else if (forRooms && o.getMinNights() != null && nights < o.getMinNights()) {
            why = "This offer needs a stay of at least " + o.getMinNights() + " nights";
        } else if (forRooms && Boolean.TRUE.equals(o.getWeekdaysOnly()) && checkIn != null
                && (checkIn.getDayOfWeek().getValue() > DayOfWeek.THURSDAY.getValue())) {
            why = "This offer is for Monday to Thursday check-ins";
        } else if (o.getMinAmount() != null && amount.compareTo(o.getMinAmount()) < 0) {
            why = "This offer needs a bill of at least Rs " + o.getMinAmount().stripTrailingZeros().toPlainString();
        }
        if (why != null) {
            return new Quote(false, why, null, BigDecimal.ZERO);
        }
        BigDecimal discount = amount.multiply(BigDecimal.valueOf(o.getDiscountPercent()))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        if (o.getMaxDiscount() != null && discount.compareTo(o.getMaxDiscount()) > 0) {
            discount = o.getMaxDiscount().setScale(2, RoundingMode.HALF_UP);
        }
        if (discount.compareTo(amount) > 0) {
            discount = amount;
        }
        return new Quote(true, o.getTitle() + ": " + o.getDiscountPercent() + "% off applied", o, discount);
    }

    /**
     * The live offer that gives this bill the biggest discount - applied automatically when the guest
     * books without typing a code. Invalid (valid=false) when no offer fits.
     */
    public Quote best(boolean forRooms, BigDecimal amount, int nights, LocalDate checkIn) {
        Quote best = null;
        for (Offer o : offerRepository.findByActiveTrue()) {
            if (o.getCode() == null) {
                continue;
            }
            Quote q = quote(o, o.getCode(), forRooms, amount, nights, checkIn);
            if (q.valid() && (best == null || q.discount().compareTo(best.discount()) > 0)) {
                best = q;
            }
        }
        return best != null ? best : new Quote(false, "No offer applies to this " + (forRooms ? "stay" : "order"), null, BigDecimal.ZERO);
    }

    /** A typed code (must be valid), or else the best offer that fits (null when none). */
    public Quote codeOrBest(String code, boolean forRooms, BigDecimal amount, int nights, LocalDate checkIn) {
        if (code != null && !code.isBlank()) {
            return require(code, forRooms, amount, nights, checkIn);
        }
        Quote q = best(forRooms, amount, nights, checkIn);
        return q.valid() ? q : null;
    }

    /** Like quote, but a bad code stops the booking / order with a clear message. */
    public Quote require(String code, boolean forRooms, BigDecimal amount, int nights, LocalDate checkIn) {
        Quote q = quote(code, forRooms, amount, nights, checkIn);
        if (!q.valid()) {
            throw new BadRequestException(q.message());
        }
        return q;
    }

    /** Counts one use of the offer (after the booking / order is saved). */
    @Transactional
    public void recordUse(Offer offer) {
        if (offer != null) {
            offerRepository.findById(offer.getId()).ifPresent(o -> {
                o.setUsedCount((o.getUsedCount() == null ? 0 : o.getUsedCount()) + 1);
                offerRepository.save(o);
            });
        }
    }
}

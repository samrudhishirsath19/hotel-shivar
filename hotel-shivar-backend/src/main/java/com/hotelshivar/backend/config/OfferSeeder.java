package com.hotelshivar.backend.config;

import com.hotelshivar.backend.entity.Offer;
import com.hotelshivar.backend.repository.OfferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * The Offers page used to show three fixed offers. On the first start with an empty offers table they are
 * saved as real offers (with codes) so the page keeps showing them; after that they are managed in the dashboard.
 */
@Component
@Order(4)
@RequiredArgsConstructor
@Slf4j
public class OfferSeeder implements CommandLineRunner {

    private final OfferRepository offerRepository;

    @Override
    public void run(String... args) {
        if (offerRepository.count() > 0) {
            upgradeOlderOffers();
            return;
        }
        String u = "https://images.unsplash.com/";
        String q = "?auto=format&fit=crop&w=800&q=70";
        LocalDate yearEnd = LocalDate.now().withMonth(12).withDayOfMonth(31);
        offerRepository.saveAll(List.of(
                Offer.builder().title("Monsoon Escape").code("MONSOON20").discountPercent(20).appliesTo(Offer.AppliesTo.ROOMS)
                        .minNights(2).validTo(yearEnd).usedCount(0).active(true)
                        .description("20% off room rates when you stay 2 nights or more. Includes breakfast and a guided walk to Tiger's Leap.")
                        .imageUrl(u + "photo-1590490360182-c33d57733427" + q).build(),
                Offer.builder().title("Weekday Getaway").code("WEEKDAY20").discountPercent(20).appliesTo(Offer.AppliesTo.ROOMS)
                        .weekdaysOnly(true).validTo(yearEnd).usedCount(0).active(true)
                        .description("20% off any room for Monday to Thursday check-ins, plus late check-out till 2:00 PM on request.")
                        .imageUrl(u + "photo-1611892440504-42a792e24d32" + q).build(),
                Offer.builder().title("Family Holiday").code("FAMILY20").discountPercent(20).appliesTo(Offer.AppliesTo.ROOMS)
                        .validTo(yearEnd).usedCount(0).active(true)
                        .description("20% off for families. Kids under 8 eat free at Shivar Kitchen.")
                        .imageUrl(u + "photo-1566665797739-1674de7a421a" + q).build()));
        log.info("Sample offers added");
    }

    /**
     * Offers saved before codes existed have no code / "applies to", so they could never be used. Give each one
     * a code made from its title and percentage (e.g. EARLYBIRD15) and mark it for room bookings. Only empty
     * fields are filled, so nothing set on the Offers page is changed.
     */
    private void upgradeOlderOffers() {
        for (Offer o : offerRepository.findAll()) {
            boolean changed = false;
            if (o.getCode() == null || o.getCode().isBlank()) {
                o.setCode(uniqueCode(o));
                changed = true;
            }
            if (o.getAppliesTo() == null) {
                o.setAppliesTo(Offer.AppliesTo.ROOMS);
                changed = true;
            }
            if (o.getUsedCount() == null) {
                o.setUsedCount(0);
                changed = true;
            }
            if (o.getWeekdaysOnly() == null) {
                o.setWeekdaysOnly(false);
                changed = true;
            }
            if (o.getWeekendsOnly() == null) {
                o.setWeekendsOnly(false);
                changed = true;
            }
            if (o.getDiscountPercent() == null) {
                o.setDiscountPercent(10);
                changed = true;
            }
            if (changed) {
                offerRepository.save(o);
                log.info("Offer \"{}\" can now be used with code {}", o.getTitle(), o.getCode());
            }
        }
    }

    private String uniqueCode(Offer o) {
        String[] words = (o.getTitle() == null ? "OFFER" : o.getTitle()).toUpperCase(java.util.Locale.ROOT)
                .replaceAll("[^A-Z0-9 ]", "").trim().split(" +");
        String base = words.length > 1 ? words[0] + words[1] : words[0];
        if (base.length() < 3) {
            base = "OFFER";
        }
        base = base.substring(0, Math.min(base.length(), 14)) + (o.getDiscountPercent() != null ? o.getDiscountPercent() : "");
        String code = base;
        for (int i = 2; offerRepository.findByCodeIgnoreCase(code).isPresent(); i++) {
            code = base.substring(0, Math.min(base.length(), 17)) + i;
        }
        return code;
    }
}

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
}

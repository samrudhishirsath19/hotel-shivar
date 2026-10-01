package com.hotelshivar.backend.controller;

import com.hotelshivar.backend.repository.BanquetEnquiryRepository;
import com.hotelshivar.backend.repository.BookingRepository;
import com.hotelshivar.backend.repository.ContactMessageRepository;
import com.hotelshivar.backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/** Protected by AuthInterceptor (everything under /api/admin/** needs a valid token). */
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final ContactMessageRepository contactMessageRepository;
    private final BanquetEnquiryRepository banquetEnquiryRepository;

    @GetMapping("/summary")
    public Map<String, Long> summary() {
        Map<String, Long> out = new LinkedHashMap<>();
        out.put("rooms", roomRepository.count());
        out.put("bookings", bookingRepository.count());
        out.put("contactMessages", contactMessageRepository.count());
        out.put("banquetEnquiries", banquetEnquiryRepository.count());
        return out;
    }
}

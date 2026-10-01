package com.hotelshivar.backend.service;

import com.hotelshivar.backend.dto.BanquetRequest;
import com.hotelshivar.backend.entity.BanquetEnquiry;
import com.hotelshivar.backend.repository.BanquetEnquiryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BanquetService {

    private final BanquetEnquiryRepository banquetEnquiryRepository;

    public BanquetEnquiry submitEnquiry(BanquetRequest request) {
        BanquetEnquiry enquiry = BanquetEnquiry.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .eventType(request.getEventType())
                .eventDate(request.getEventDate())
                .guestCount(request.getGuestCount())
                .message(request.getMessage())
                .build();
        return banquetEnquiryRepository.save(enquiry);
    }

    public List<BanquetEnquiry> getAllEnquiries() {
        return banquetEnquiryRepository.findAll();
    }
}

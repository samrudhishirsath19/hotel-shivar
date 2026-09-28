package com.hotelshivar.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "banquet_enquiries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BanquetEnquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    private String phone;

    /** e.g. WEDDING, BIRTHDAY, CORPORATE, CONFERENCE */
    private String eventType;

    private LocalDate eventDate;

    private Integer guestCount;

    @Column(length = 2000)
    private String message;

    @Builder.Default
    private Boolean resolved = false;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

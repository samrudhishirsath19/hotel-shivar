package com.hotelshivar.backend.entity;

import com.hotelshivar.backend.entity.enums.RoomType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String roomNumber;

    /** Display name on the website, e.g. "Deluxe Room". */
    private String name;

    // varchar (not MySQL ENUM) so new room types can be added without changing the table
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(30)")
    private RoomType type;

    @Column(nullable = false)
    private BigDecimal pricePerNight;

    @Column(length = 2000)
    private String description;

    /** e.g. "280 sq ft" */
    private String size;

    private Integer capacity;

    /** Comma separated, e.g. "King bed, Free Wi-Fi, Air conditioning" */
    @Column(length = 1000)
    private String amenities;

    @Column(length = 1000)
    private String imageUrl;

    @Column(nullable = false)
    @Builder.Default
    private Boolean available = true;
}

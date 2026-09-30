package com.hotelshivar.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/** An employee of the hotel (directory only - logins are managed under Users). */
@Entity
@Table(name = "staff_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** Cook, Waiter, Receptionist ... */
    @Column(nullable = false)
    private String jobTitle;

    @Column(length = 20)
    private String phone;

    private LocalDate joinedOn;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}

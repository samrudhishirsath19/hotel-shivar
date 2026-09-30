package com.hotelshivar.backend.entity;

import com.hotelshivar.backend.entity.enums.AppPermission;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Whether one department (role) has one permission (sub-module / action). Managed by the super admin. */
@Entity
@Table(name = "staff_permissions", uniqueConstraints = @UniqueConstraint(columnNames = {"role", "permission"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(40)")
    private AppPermission permission;

    @Column(nullable = false)
    private Boolean enabled;

    private LocalDateTime updatedAt;

    private String updatedBy;
}

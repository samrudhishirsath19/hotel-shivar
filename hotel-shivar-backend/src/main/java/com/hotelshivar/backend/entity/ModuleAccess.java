package com.hotelshivar.backend.entity;

import com.hotelshivar.backend.entity.enums.AppModule;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Whether one department (role) may use one module. Managed by the super admin. */
@Entity
@Table(name = "module_access", uniqueConstraints = @UniqueConstraint(columnNames = {"role", "module"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModuleAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(30)")
    private AppModule module;

    @Column(nullable = false)
    private Boolean enabled;

    private LocalDateTime updatedAt;

    private String updatedBy;
}

package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.StaffPermission;
import com.hotelshivar.backend.entity.enums.AppPermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StaffPermissionRepository extends JpaRepository<StaffPermission, Long> {
    Optional<StaffPermission> findByRoleAndPermission(String role, AppPermission permission);
}

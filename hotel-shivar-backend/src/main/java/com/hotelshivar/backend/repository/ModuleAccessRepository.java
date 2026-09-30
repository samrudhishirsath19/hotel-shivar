package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.ModuleAccess;
import com.hotelshivar.backend.entity.enums.AppModule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ModuleAccessRepository extends JpaRepository<ModuleAccess, Long> {
    Optional<ModuleAccess> findByRoleAndModule(String role, AppModule module);
}

package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.StaffMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StaffMemberRepository extends JpaRepository<StaffMember, Long> {
    List<StaffMember> findAllByOrderByNameAsc();
}

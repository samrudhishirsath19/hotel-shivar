package com.hotelshivar.backend.repository;

import com.hotelshivar.backend.entity.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, Long> {

    /** The newest request that can still be used. */
    Optional<PasswordReset> findFirstByCustomerIdAndClosedAtIsNullOrderByCreatedAtDesc(Long customerId);

    List<PasswordReset> findByCustomerIdAndClosedAtIsNull(Long customerId);

    Optional<PasswordReset> findByTokenHash(String tokenHash);

    /** Requests made recently (limit how many emails one account can trigger). */
    List<PasswordReset> findByCustomerIdAndCreatedAtAfterOrderByCreatedAtDesc(Long customerId, LocalDateTime since);

    @Modifying
    @Query("delete from PasswordReset p where p.createdAt < :before")
    int deleteOlderThan(@Param("before") LocalDateTime before);
}

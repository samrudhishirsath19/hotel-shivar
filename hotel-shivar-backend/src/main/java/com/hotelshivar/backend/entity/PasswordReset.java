package com.hotelshivar.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * One "forgot password" request of a customer account. The email carries a 6-digit OTP and, as an alternative,
 * a reset link with a random token. Only hashes are stored: the OTP as BCrypt, the token as SHA-256.
 * Either one can be used once; using one (or asking for a new request, or too many wrong OTPs) closes the request.
 */
@Entity
@Table(name = "password_resets", indexes = @Index(name = "idx_password_resets_customer", columnList = "customerId"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordReset {

    public enum CloseReason { USED, REPLACED, TOO_MANY_ATTEMPTS }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long customerId;

    /** BCrypt hash of the 6-digit OTP. */
    @Column(nullable = false, length = 100)
    private String otpHash;

    @Column(nullable = false)
    private LocalDateTime otpExpiresAt;

    /** SHA-256 (hex) of the reset link token. */
    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private LocalDateTime tokenExpiresAt;

    /** Wrong OTPs typed so far. */
    @Column(nullable = false)
    @Builder.Default
    private Integer attempts = 0;

    /** Set when the request can no longer be used. */
    private LocalDateTime closedAt;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(30)")
    private CloseReason closeReason;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /** Two requests using the same code at the same moment: only the first one wins. */
    @Version
    private Long version;

    public boolean isOpen() {
        return closedAt == null;
    }

    public void close(CloseReason reason) {
        this.closedAt = LocalDateTime.now();
        this.closeReason = reason;
    }
}

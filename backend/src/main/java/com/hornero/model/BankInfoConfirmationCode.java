package com.hornero.model;

import jakarta.persistence.*;
import java.security.SecureRandom;
import java.time.Instant;

@Entity
@Table(name = "bank_info_confirmation_code")
public class BankInfoConfirmationCode {

    private static final SecureRandom RANDOM = new SecureRandom();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 6)
    private String code;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private boolean used = false;

    public BankInfoConfirmationCode() {
        this.createdAt = Instant.now();
        this.code = generateSixDigitCode();
        // Corta duración: es un código que el usuario tipea al toque, no un link.
        this.expiresAt = Instant.now().plusSeconds(600);
    }

    public BankInfoConfirmationCode(User user) {
        this();
        this.user = user;
    }

    private static String generateSixDigitCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    public boolean isExpired() {
        return Instant.now().isAfter(this.expiresAt);
    }

    public boolean isValid() {
        return !this.used && !isExpired();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
}

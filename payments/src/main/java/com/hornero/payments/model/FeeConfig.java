package com.hornero.payments.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fee_config", schema = "payments")
public class FeeConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "platform_rate", nullable = false, precision = 6, scale = 4)
    private BigDecimal platformRate;

    @Column(name = "provider_rate", nullable = false, precision = 6, scale = 4)
    private BigDecimal providerRate;

    @Column(name = "updated_by_user_id", nullable = false)
    private Long updatedByUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public BigDecimal getPlatformRate() { return platformRate; }
    public BigDecimal getProviderRate() { return providerRate; }
    public Long getUpdatedByUserId() { return updatedByUserId; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setPlatformRate(BigDecimal platformRate) { this.platformRate = platformRate; }
    public void setProviderRate(BigDecimal providerRate) { this.providerRate = providerRate; }
    public void setUpdatedByUserId(Long updatedByUserId) { this.updatedByUserId = updatedByUserId; }
}

package com.hornero.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class FeeConfigResponse {

    private Long id;
    private BigDecimal platformRate;
    private BigDecimal providerRate;
    private Long updatedByUserId;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BigDecimal getPlatformRate() { return platformRate; }
    public void setPlatformRate(BigDecimal platformRate) { this.platformRate = platformRate; }

    public BigDecimal getProviderRate() { return providerRate; }
    public void setProviderRate(BigDecimal providerRate) { this.providerRate = providerRate; }

    public Long getUpdatedByUserId() { return updatedByUserId; }
    public void setUpdatedByUserId(Long updatedByUserId) { this.updatedByUserId = updatedByUserId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

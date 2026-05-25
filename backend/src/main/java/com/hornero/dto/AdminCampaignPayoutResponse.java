package com.hornero.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AdminCampaignPayoutResponse {

    private Long payoutId;
    private Long campaignId;
    private BigDecimal grossAmount;
    private BigDecimal platformFee;
    private BigDecimal providerFee;
    private BigDecimal netAmount;
    private String paymentProvider;
    private String status;
    private String idPayoutExternal;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;

    public Long getPayoutId() { return payoutId; }
    public void setPayoutId(Long payoutId) { this.payoutId = payoutId; }

    public Long getCampaignId() { return campaignId; }
    public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }

    public BigDecimal getGrossAmount() { return grossAmount; }
    public void setGrossAmount(BigDecimal grossAmount) { this.grossAmount = grossAmount; }

    public BigDecimal getPlatformFee() { return platformFee; }
    public void setPlatformFee(BigDecimal platformFee) { this.platformFee = platformFee; }

    public BigDecimal getProviderFee() { return providerFee; }
    public void setProviderFee(BigDecimal providerFee) { this.providerFee = providerFee; }

    public BigDecimal getNetAmount() { return netAmount; }
    public void setNetAmount(BigDecimal netAmount) { this.netAmount = netAmount; }

    public String getPaymentProvider() { return paymentProvider; }
    public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getIdPayoutExternal() { return idPayoutExternal; }
    public void setIdPayoutExternal(String idPayoutExternal) { this.idPayoutExternal = idPayoutExternal; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }
}

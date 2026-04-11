package com.hornero.payments.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PayoutStatusResponse {

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

    public PayoutStatusResponse(Long payoutId, Long campaignId, BigDecimal grossAmount,
                                BigDecimal platformFee, BigDecimal providerFee, BigDecimal netAmount,
                                String paymentProvider, String status, String idPayoutExternal,
                                LocalDateTime createdAt, LocalDateTime processedAt) {
        this.payoutId = payoutId;
        this.campaignId = campaignId;
        this.grossAmount = grossAmount;
        this.platformFee = platformFee;
        this.providerFee = providerFee;
        this.netAmount = netAmount;
        this.paymentProvider = paymentProvider;
        this.status = status;
        this.idPayoutExternal = idPayoutExternal;
        this.createdAt = createdAt;
        this.processedAt = processedAt;
    }

    public Long getPayoutId() { return payoutId; }
    public Long getCampaignId() { return campaignId; }
    public BigDecimal getGrossAmount() { return grossAmount; }
    public BigDecimal getPlatformFee() { return platformFee; }
    public BigDecimal getProviderFee() { return providerFee; }
    public BigDecimal getNetAmount() { return netAmount; }
    public String getPaymentProvider() { return paymentProvider; }
    public String getStatus() { return status; }
    public String getIdPayoutExternal() { return idPayoutExternal; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getProcessedAt() { return processedAt; }
}

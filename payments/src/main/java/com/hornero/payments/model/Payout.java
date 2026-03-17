package com.hornero.payments.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payout", schema = "payments")
public class Payout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_campaign", nullable = false)
    private Long idCampaign;

    @Column(name = "id_creator_user", nullable = false)
    private Long idCreatorUser;

    @Column(name = "gross_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "platform_fee", nullable = false, precision = 15, scale = 2)
    private BigDecimal platformFee;

    @Column(name = "provider_fee", nullable = false, precision = 15, scale = 2)
    private BigDecimal providerFee;

    @Column(name = "net_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal netAmount;

    @Column(name = "payment_provider", nullable = false, length = 30)
    private String paymentProvider;
    // MERCADO_PAGO | BANK_TRANSFER | etc.

    @Column(nullable = false, length = 20)
    private String status = "PENDING";
    // PENDING | PROCESSING | COMPLETED | FAILED

    @Column(name = "id_payout_external", length = 50)
    private String idPayoutExternal;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public Long getIdCampaign() { return idCampaign; }
    public Long getIdCreatorUser() { return idCreatorUser; }
    public BigDecimal getGrossAmount() { return grossAmount; }
    public BigDecimal getPlatformFee() { return platformFee; }
    public BigDecimal getProviderFee() { return providerFee; }
    public BigDecimal getNetAmount() { return netAmount; }
    public String getPaymentProvider() { return paymentProvider; }
    public String getStatus() { return status; }
    public String getIdPayoutExternal() { return idPayoutExternal; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getProcessedAt() { return processedAt; }

    // Setters
    public void setIdCampaign(Long idCampaign) { this.idCampaign = idCampaign; }
    public void setIdCreatorUser(Long idCreatorUser) { this.idCreatorUser = idCreatorUser; }
    public void setGrossAmount(BigDecimal grossAmount) { this.grossAmount = grossAmount; }
    public void setPlatformFee(BigDecimal platformFee) { this.platformFee = platformFee; }
    public void setProviderFee(BigDecimal providerFee) { this.providerFee = providerFee; }
    public void setNetAmount(BigDecimal netAmount) { this.netAmount = netAmount; }
    public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }
    public void setStatus(String status) { this.status = status; }
    public void setIdPayoutExternal(String idPayoutExternal) { this.idPayoutExternal = idPayoutExternal; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }
}

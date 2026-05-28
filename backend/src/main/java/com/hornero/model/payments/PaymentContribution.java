package com.hornero.model.payments;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Read-only POJO mirroring rows from the payments.contribution table, which is
// owned by the payments microservice. Not a JPA entity — populated by
// PaymentContributionRepository via native SQL so the hornero backend can boot
// without that schema existing locally.
public class PaymentContribution {

    private Long id;
    private Long idUser;
    private Long idCampaign;
    private BigDecimal amount;
    private Long rewardId;
    private BigDecimal rewardPrice;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private PaymentTransaction transaction;

    public Long getId() { return id; }
    public Long getIdUser() { return idUser; }
    public Long getIdCampaign() { return idCampaign; }
    public BigDecimal getAmount() { return amount; }
    public Long getRewardId() { return rewardId; }
    public BigDecimal getRewardPrice() { return rewardPrice; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public PaymentTransaction getTransaction() { return transaction; }

    public void setId(Long id) { this.id = id; }
    public void setIdUser(Long idUser) { this.idUser = idUser; }
    public void setIdCampaign(Long idCampaign) { this.idCampaign = idCampaign; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setRewardId(Long rewardId) { this.rewardId = rewardId; }
    public void setRewardPrice(BigDecimal rewardPrice) { this.rewardPrice = rewardPrice; }
    public void setStatus(String status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setTransaction(PaymentTransaction transaction) { this.transaction = transaction; }
}

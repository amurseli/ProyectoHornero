package com.hornero.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AdminCampaignContributionResponse {

    private Long contributionId;
    private Long contributorUserId;
    private String contributorName;
    private String contributorEmail;
    private BigDecimal amount;
    private Long rewardId;
    private BigDecimal rewardPrice;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private TransactionInfo transaction;

    public static class TransactionInfo {
        private Long transactionId;
        private BigDecimal amount;
        private String transactionMethod;
        private String paymentProvider;
        private String externalTransactionId;
        private String hashTx;
        private LocalDateTime createdAt;

        public Long getTransactionId() { return transactionId; }
        public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }

        public String getTransactionMethod() { return transactionMethod; }
        public void setTransactionMethod(String transactionMethod) { this.transactionMethod = transactionMethod; }

        public String getPaymentProvider() { return paymentProvider; }
        public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }

        public String getExternalTransactionId() { return externalTransactionId; }
        public void setExternalTransactionId(String externalTransactionId) { this.externalTransactionId = externalTransactionId; }

        public String getHashTx() { return hashTx; }
        public void setHashTx(String hashTx) { this.hashTx = hashTx; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    public Long getContributionId() { return contributionId; }
    public void setContributionId(Long contributionId) { this.contributionId = contributionId; }

    public Long getContributorUserId() { return contributorUserId; }
    public void setContributorUserId(Long contributorUserId) { this.contributorUserId = contributorUserId; }

    public String getContributorName() { return contributorName; }
    public void setContributorName(String contributorName) { this.contributorName = contributorName; }

    public String getContributorEmail() { return contributorEmail; }
    public void setContributorEmail(String contributorEmail) { this.contributorEmail = contributorEmail; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public Long getRewardId() { return rewardId; }
    public void setRewardId(Long rewardId) { this.rewardId = rewardId; }

    public BigDecimal getRewardPrice() { return rewardPrice; }
    public void setRewardPrice(BigDecimal rewardPrice) { this.rewardPrice = rewardPrice; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public TransactionInfo getTransaction() { return transaction; }
    public void setTransaction(TransactionInfo transaction) { this.transaction = transaction; }
}

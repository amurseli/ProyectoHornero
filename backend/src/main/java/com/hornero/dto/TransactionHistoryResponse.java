package com.hornero.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionHistoryResponse {

    private Long contributionId;
    private Long campaignId;
    private String campaignTitle;
    private BigDecimal amount;
    private String contributionStatus;
    private Long transactionId;
    private String transactionMethod;
    private String paymentProvider;
    private String externalTransactionId;
    private String hashTx;
    private String explorerUrl;
    private LocalDateTime createdAt;

    public Long getContributionId() { return contributionId; }
    public void setContributionId(Long contributionId) { this.contributionId = contributionId; }

    public Long getCampaignId() { return campaignId; }
    public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }

    public String getCampaignTitle() { return campaignTitle; }
    public void setCampaignTitle(String campaignTitle) { this.campaignTitle = campaignTitle; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getContributionStatus() { return contributionStatus; }
    public void setContributionStatus(String contributionStatus) { this.contributionStatus = contributionStatus; }

    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }

    public String getTransactionMethod() { return transactionMethod; }
    public void setTransactionMethod(String transactionMethod) { this.transactionMethod = transactionMethod; }

    public String getPaymentProvider() { return paymentProvider; }
    public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }

    public String getExternalTransactionId() { return externalTransactionId; }
    public void setExternalTransactionId(String externalTransactionId) { this.externalTransactionId = externalTransactionId; }

    public String getHashTx() { return hashTx; }
    public void setHashTx(String hashTx) { this.hashTx = hashTx; }

    public String getExplorerUrl() { return explorerUrl; }
    public void setExplorerUrl(String explorerUrl) { this.explorerUrl = explorerUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

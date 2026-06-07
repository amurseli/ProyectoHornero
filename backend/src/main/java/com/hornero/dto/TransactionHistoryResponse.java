package com.hornero.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionHistoryResponse {

    private String historyType;
    private Long contributionId;
    private Long campaignId;
    private String campaignTitle;
    private BigDecimal amount;
    private String entryStatus;
    private Long transactionId;
    private String transactionMethod;
    private String paymentProvider;
    private String senderLabel;
    private String recipientLabel;
    private String reference;
    private String hashTx;
    private String explorerUrl;
    private String operationNumber;
    private LocalDateTime createdAt;

    public String getHistoryType() { return historyType; }
    public void setHistoryType(String historyType) { this.historyType = historyType; }

    public Long getContributionId() { return contributionId; }
    public void setContributionId(Long contributionId) { this.contributionId = contributionId; }

    public Long getCampaignId() { return campaignId; }
    public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }

    public String getCampaignTitle() { return campaignTitle; }
    public void setCampaignTitle(String campaignTitle) { this.campaignTitle = campaignTitle; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getEntryStatus() { return entryStatus; }
    public void setEntryStatus(String entryStatus) { this.entryStatus = entryStatus; }

    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }

    public String getTransactionMethod() { return transactionMethod; }
    public void setTransactionMethod(String transactionMethod) { this.transactionMethod = transactionMethod; }

    public String getPaymentProvider() { return paymentProvider; }
    public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }

    public String getSenderLabel() { return senderLabel; }
    public void setSenderLabel(String senderLabel) { this.senderLabel = senderLabel; }

    public String getRecipientLabel() { return recipientLabel; }
    public void setRecipientLabel(String recipientLabel) { this.recipientLabel = recipientLabel; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getHashTx() { return hashTx; }
    public void setHashTx(String hashTx) { this.hashTx = hashTx; }

    public String getExplorerUrl() { return explorerUrl; }
    public void setExplorerUrl(String explorerUrl) { this.explorerUrl = explorerUrl; }

    public String getOperationNumber() { return operationNumber; }
    public void setOperationNumber(String operationNumber) { this.operationNumber = operationNumber; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

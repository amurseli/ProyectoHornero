package com.hornero.payments.dto;

import java.math.BigDecimal;

public class ContributionStatusResponse {

    private Long contributionId;
    private Long campaignId;
    private BigDecimal amount;
    private String status;
    private TransactionInfo transaction;

    public ContributionStatusResponse(Long contributionId, Long campaignId, BigDecimal amount, String status, TransactionInfo transaction) {
        this.contributionId = contributionId;
        this.campaignId = campaignId;
        this.amount = amount;
        this.status = status;
        this.transaction = transaction;
    }

    public Long getContributionId() { return contributionId; }
    public Long getCampaignId() { return campaignId; }
    public BigDecimal getAmount() { return amount; }
    public String getStatus() { return status; }
    public TransactionInfo getTransaction() { return transaction; }

    public static class TransactionInfo {
        private Long id;
        private String method;
        private Long idTransactionMp;

        public TransactionInfo(Long id, String method, Long idTransactionMp) {
            this.id = id;
            this.method = method;
            this.idTransactionMp = idTransactionMp;
        }

        public Long getId() { return id; }
        public String getMethod() { return method; }
        public Long getIdTransactionMp() { return idTransactionMp; }
    }
}

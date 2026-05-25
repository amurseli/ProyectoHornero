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
        private String idTransactionExternal;
        private String paymentProvider;
        private String hashTx;

        public TransactionInfo(Long id, String method, String idTransactionExternal, String paymentProvider, String hashTx) {
            this.id = id;
            this.method = method;
            this.idTransactionExternal = idTransactionExternal;
            this.paymentProvider = paymentProvider;
            this.hashTx = hashTx;
        }

        public Long getId() { return id; }
        public String getMethod() { return method; }
        public String getIdTransactionExternal() { return idTransactionExternal; }
        public String getPaymentProvider() { return paymentProvider; }
        public String getHashTx() { return hashTx; }
    }
}

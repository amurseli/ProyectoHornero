package com.hornero.payments.dto;

import java.math.BigDecimal;

public class InitiateContributionResponse {

    private Long contributionId;
    private String publicKey;
    private BigDecimal amount;
    private String currency;

    public InitiateContributionResponse(Long contributionId, String publicKey, BigDecimal amount, String currency) {
        this.contributionId = contributionId;
        this.publicKey = publicKey;
        this.amount = amount;
        this.currency = currency;
    }

    public Long getContributionId() { return contributionId; }
    public String getPublicKey() { return publicKey; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
}

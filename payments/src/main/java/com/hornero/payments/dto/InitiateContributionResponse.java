package com.hornero.payments.dto;

import java.math.BigDecimal;

public class InitiateContributionResponse {

    private Long contributionId;
    private String publicKey;
    private BigDecimal amount;
    private String currency;
    private ContributionRewardInfo reward;
    private String status;

    public InitiateContributionResponse(Long contributionId, String publicKey, BigDecimal amount, String currency, ContributionRewardInfo reward, String status) {
        this.contributionId = contributionId;
        this.publicKey = publicKey;
        this.amount = amount;
        this.currency = currency;
        this.reward = reward;
        this.status = status;
    }

    public Long getContributionId() { return contributionId; }
    public String getPublicKey() { return publicKey; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public ContributionRewardInfo getReward() { return reward; }
    public String getStatus() { return status; }
}

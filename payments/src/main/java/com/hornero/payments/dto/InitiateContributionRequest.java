package com.hornero.payments.dto;

import java.math.BigDecimal;

public class InitiateContributionRequest {

    private Long campaignId;
    private BigDecimal amount;
    private Long rewardId;

    public Long getCampaignId() { return campaignId; }
    public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public Long getRewardId() { return rewardId; }
    public void setRewardId(Long rewardId) { this.rewardId = rewardId; }
}

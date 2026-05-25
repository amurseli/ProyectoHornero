package com.hornero.payments.dto;

import java.math.BigDecimal;

public class CampaignContributionSummaryResponse {

    private Long campaignId;
    private BigDecimal approvedTotal;
    private ContributionRewardInfo currentReward;

    public CampaignContributionSummaryResponse(Long campaignId, BigDecimal approvedTotal, ContributionRewardInfo currentReward) {
        this.campaignId = campaignId;
        this.approvedTotal = approvedTotal;
        this.currentReward = currentReward;
    }

    public Long getCampaignId() { return campaignId; }
    public BigDecimal getApprovedTotal() { return approvedTotal; }
    public ContributionRewardInfo getCurrentReward() { return currentReward; }
}

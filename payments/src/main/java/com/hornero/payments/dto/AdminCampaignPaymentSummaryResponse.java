package com.hornero.payments.dto;

import java.math.BigDecimal;

public class AdminCampaignPaymentSummaryResponse {

    private Long campaignId;
    private long approvedContributionCount;
    private BigDecimal approvedAmount;

    public AdminCampaignPaymentSummaryResponse() {
    }

    public AdminCampaignPaymentSummaryResponse(Long campaignId, long approvedContributionCount, BigDecimal approvedAmount) {
        this.campaignId = campaignId;
        this.approvedContributionCount = approvedContributionCount;
        this.approvedAmount = approvedAmount;
    }

    public Long getCampaignId() { return campaignId; }
    public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }

    public long getApprovedContributionCount() { return approvedContributionCount; }
    public void setApprovedContributionCount(long approvedContributionCount) { this.approvedContributionCount = approvedContributionCount; }

    public BigDecimal getApprovedAmount() { return approvedAmount; }
    public void setApprovedAmount(BigDecimal approvedAmount) { this.approvedAmount = approvedAmount; }
}

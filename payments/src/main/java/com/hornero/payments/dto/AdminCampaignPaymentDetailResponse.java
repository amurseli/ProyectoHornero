package com.hornero.payments.dto;

import java.math.BigDecimal;
import java.util.List;

public class AdminCampaignPaymentDetailResponse {

    private Long campaignId;
    private BigDecimal approvedAmount;
    private long approvedContributionCount;
    private List<AdminCampaignContributionDataResponse> contributions;

    public Long getCampaignId() { return campaignId; }
    public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }

    public BigDecimal getApprovedAmount() { return approvedAmount; }
    public void setApprovedAmount(BigDecimal approvedAmount) { this.approvedAmount = approvedAmount; }

    public long getApprovedContributionCount() { return approvedContributionCount; }
    public void setApprovedContributionCount(long approvedContributionCount) { this.approvedContributionCount = approvedContributionCount; }

    public List<AdminCampaignContributionDataResponse> getContributions() { return contributions; }
    public void setContributions(List<AdminCampaignContributionDataResponse> contributions) { this.contributions = contributions; }
}

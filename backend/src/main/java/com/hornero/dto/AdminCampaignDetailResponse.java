package com.hornero.dto;

import java.math.BigDecimal;
import java.util.List;

public class AdminCampaignDetailResponse {

    private AdminCampaignSummaryResponse campaign;
    private BigDecimal approvedAmount;
    private long approvedContributionCount;
    private List<AdminCampaignContributionResponse> contributions;

    public AdminCampaignSummaryResponse getCampaign() { return campaign; }
    public void setCampaign(AdminCampaignSummaryResponse campaign) { this.campaign = campaign; }

    public BigDecimal getApprovedAmount() { return approvedAmount; }
    public void setApprovedAmount(BigDecimal approvedAmount) { this.approvedAmount = approvedAmount; }

    public long getApprovedContributionCount() { return approvedContributionCount; }
    public void setApprovedContributionCount(long approvedContributionCount) { this.approvedContributionCount = approvedContributionCount; }

    public List<AdminCampaignContributionResponse> getContributions() { return contributions; }
    public void setContributions(List<AdminCampaignContributionResponse> contributions) { this.contributions = contributions; }
}

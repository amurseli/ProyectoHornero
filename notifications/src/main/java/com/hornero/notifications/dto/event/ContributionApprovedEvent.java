package com.hornero.notifications.dto.event;

import java.math.BigDecimal;

// Payload del evento CONTRIBUTION_APPROVED, publicado por Payments
// cuando MercadoPago confirma una contribucion.
public class ContributionApprovedEvent {

    private Long contributionId;
    private Long userId;
    private String userEmail;
    private String userFirstName;
    private Long campaignId;
    private String campaignTitle;
    private BigDecimal amount;

    public Long getContributionId() { return contributionId; }
    public Long getUserId() { return userId; }
    public String getUserEmail() { return userEmail; }
    public String getUserFirstName() { return userFirstName; }
    public Long getCampaignId() { return campaignId; }
    public String getCampaignTitle() { return campaignTitle; }
    public BigDecimal getAmount() { return amount; }

    public void setContributionId(Long contributionId) { this.contributionId = contributionId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public void setUserFirstName(String userFirstName) { this.userFirstName = userFirstName; }
    public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }
    public void setCampaignTitle(String campaignTitle) { this.campaignTitle = campaignTitle; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}

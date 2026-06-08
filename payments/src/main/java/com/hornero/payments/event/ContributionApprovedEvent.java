package com.hornero.payments.event;

import java.math.BigDecimal;

// Payload del evento CONTRIBUTION_APPROVED, publicado hacia el servicio de notificaciones
// cuando una contribucion es aprobada por MercadoPago.
public class ContributionApprovedEvent {

    private Long contributionId;
    private Long userId;
    private String userEmail;
    private String userFirstName;
    private Long campaignId;
    private String campaignTitle;
    private BigDecimal amount;

    public ContributionApprovedEvent() {
    }

    public ContributionApprovedEvent(Long contributionId, Long userId, String userEmail, String userFirstName,
                                      Long campaignId, String campaignTitle, BigDecimal amount) {
        this.contributionId = contributionId;
        this.userId = userId;
        this.userEmail = userEmail;
        this.userFirstName = userFirstName;
        this.campaignId = campaignId;
        this.campaignTitle = campaignTitle;
        this.amount = amount;
    }

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

package com.hornero.notifications.dto.event;

import java.math.BigDecimal;
import java.util.List;

// Payload compartido por los eventos CAMPAIGN_SUCCEEDED y CAMPAIGN_FAILED,
// publicados por el Backend al finalizar una campania (mismo formato, distinto 'type').
public class CampaignFinalizedEvent {

    private Long campaignId;
    private String campaignTitle;
    private BigDecimal targetAmount;
    private BigDecimal raisedAmount;
    private CreatorInfo creator;
    private List<ContributorInfo> contributors;

    public Long getCampaignId() { return campaignId; }
    public String getCampaignTitle() { return campaignTitle; }
    public BigDecimal getTargetAmount() { return targetAmount; }
    public BigDecimal getRaisedAmount() { return raisedAmount; }
    public CreatorInfo getCreator() { return creator; }
    public List<ContributorInfo> getContributors() { return contributors; }

    public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }
    public void setCampaignTitle(String campaignTitle) { this.campaignTitle = campaignTitle; }
    public void setTargetAmount(BigDecimal targetAmount) { this.targetAmount = targetAmount; }
    public void setRaisedAmount(BigDecimal raisedAmount) { this.raisedAmount = raisedAmount; }
    public void setCreator(CreatorInfo creator) { this.creator = creator; }
    public void setContributors(List<ContributorInfo> contributors) { this.contributors = contributors; }

    public static class CreatorInfo {
        private Long userId;
        private String email;
        private String firstName;

        public Long getUserId() { return userId; }
        public String getEmail() { return email; }
        public String getFirstName() { return firstName; }

        public void setUserId(Long userId) { this.userId = userId; }
        public void setEmail(String email) { this.email = email; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
    }

    public static class ContributorInfo {
        private Long userId;
        private String email;
        private String firstName;
        private BigDecimal amount;

        public Long getUserId() { return userId; }
        public String getEmail() { return email; }
        public String getFirstName() { return firstName; }
        public BigDecimal getAmount() { return amount; }

        public void setUserId(Long userId) { this.userId = userId; }
        public void setEmail(String email) { this.email = email; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }
}

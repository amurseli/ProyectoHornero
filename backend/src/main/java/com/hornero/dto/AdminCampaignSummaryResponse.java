package com.hornero.dto;

import com.hornero.model.Campaign;

import java.math.BigDecimal;
import java.time.LocalDate;

public class AdminCampaignSummaryResponse {

    private Long id;
    private String title;
    private String status;
    private String moneyStatus;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal currentAmount;
    private BigDecimal targetAmount;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private boolean reachedGoal;
    private boolean ended;
    private boolean transferReady;
    private boolean transferCompleted;
    private long approvedContributionCount;

    public static AdminCampaignSummaryResponse fromEntity(Campaign campaign, LocalDate today, long approvedContributionCount) {
        AdminCampaignSummaryResponse response = new AdminCampaignSummaryResponse();
        response.id = campaign.getId();
        response.title = campaign.getTitle();
        response.status = campaign.getStatus();
        response.moneyStatus = campaign.getMoneyStatus();
        response.startDate = campaign.getStartDate();
        response.endDate = campaign.getEndDate();
        response.currentAmount = campaign.getCurrentAmount();
        response.targetAmount = campaign.getTargetAmount();
        response.ownerId = campaign.getOwner() != null ? campaign.getOwner().getId() : null;
        response.ownerName = campaign.getOwner() != null
                ? buildOwnerName(campaign.getOwner().getFirstName(), campaign.getOwner().getLastName(), campaign.getOwner().getUserName())
                : null;
        response.ownerEmail = campaign.getOwner() != null ? campaign.getOwner().getEmail() : null;

        BigDecimal current = campaign.getCurrentAmount() != null ? campaign.getCurrentAmount() : BigDecimal.ZERO;
        BigDecimal target = campaign.getTargetAmount();
        response.reachedGoal = target != null && current.compareTo(target) >= 0;
        response.ended = campaign.getEndDate() != null && today.isAfter(campaign.getEndDate());
        response.transferCompleted = "PAYOUT_COMPLETED".equals(campaign.getMoneyStatus());
        response.approvedContributionCount = approvedContributionCount;
        response.transferReady = response.ended
                && response.reachedGoal
                && !response.transferCompleted
                && approvedContributionCount > 0;
        return response;
    }

    private static String buildOwnerName(String firstName, String lastName, String userName) {
        String fullName = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
        return !fullName.isBlank() ? fullName : userName;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getStatus() { return status; }
    public String getMoneyStatus() { return moneyStatus; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public BigDecimal getCurrentAmount() { return currentAmount; }
    public BigDecimal getTargetAmount() { return targetAmount; }
    public Long getOwnerId() { return ownerId; }
    public String getOwnerName() { return ownerName; }
    public String getOwnerEmail() { return ownerEmail; }
    public boolean isReachedGoal() { return reachedGoal; }
    public boolean isEnded() { return ended; }
    public boolean isTransferReady() { return transferReady; }
    public boolean isTransferCompleted() { return transferCompleted; }
    public long getApprovedContributionCount() { return approvedContributionCount; }
}

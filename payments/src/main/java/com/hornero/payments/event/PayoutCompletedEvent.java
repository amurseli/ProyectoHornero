package com.hornero.payments.event;

import java.math.BigDecimal;

// Payload del evento PAYOUT_COMPLETED, publicado hacia el servicio de notificaciones
// cuando el dinero recaudado se transfiere efectivamente a quien creo la campana.
public class PayoutCompletedEvent {

    private Long payoutId;
    private Long creatorId;
    private String creatorEmail;
    private String creatorFirstName;
    private Long campaignId;
    private String campaignTitle;
    private BigDecimal amountTransferred;

    public PayoutCompletedEvent() {
    }

    public PayoutCompletedEvent(Long payoutId, Long creatorId, String creatorEmail, String creatorFirstName,
                                Long campaignId, String campaignTitle, BigDecimal amountTransferred) {
        this.payoutId = payoutId;
        this.creatorId = creatorId;
        this.creatorEmail = creatorEmail;
        this.creatorFirstName = creatorFirstName;
        this.campaignId = campaignId;
        this.campaignTitle = campaignTitle;
        this.amountTransferred = amountTransferred;
    }

    public Long getPayoutId() { return payoutId; }
    public Long getCreatorId() { return creatorId; }
    public String getCreatorEmail() { return creatorEmail; }
    public String getCreatorFirstName() { return creatorFirstName; }
    public Long getCampaignId() { return campaignId; }
    public String getCampaignTitle() { return campaignTitle; }
    public BigDecimal getAmountTransferred() { return amountTransferred; }

    public void setPayoutId(Long payoutId) { this.payoutId = payoutId; }
    public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }
    public void setCreatorEmail(String creatorEmail) { this.creatorEmail = creatorEmail; }
    public void setCreatorFirstName(String creatorFirstName) { this.creatorFirstName = creatorFirstName; }
    public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }
    public void setCampaignTitle(String campaignTitle) { this.campaignTitle = campaignTitle; }
    public void setAmountTransferred(BigDecimal amountTransferred) { this.amountTransferred = amountTransferred; }
}

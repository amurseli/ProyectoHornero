package com.hornero.dto;

public class AdminCampaignTransferResponse {

    private AdminCampaignSummaryResponse campaign;
    private AdminCampaignPayoutResponse payout;
    private Long creatorId;
    private String creatorName;
    private String creatorEmail;
    private String accountType;
    private String cbu;
    private String alias;
    private String bankOrWalletName;
    private String accountHolderName;

    public AdminCampaignSummaryResponse getCampaign() { return campaign; }
    public void setCampaign(AdminCampaignSummaryResponse campaign) { this.campaign = campaign; }

    public AdminCampaignPayoutResponse getPayout() { return payout; }
    public void setPayout(AdminCampaignPayoutResponse payout) { this.payout = payout; }

    public Long getCreatorId() { return creatorId; }
    public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }

    public String getCreatorName() { return creatorName; }
    public void setCreatorName(String creatorName) { this.creatorName = creatorName; }

    public String getCreatorEmail() { return creatorEmail; }
    public void setCreatorEmail(String creatorEmail) { this.creatorEmail = creatorEmail; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public String getCbu() { return cbu; }
    public void setCbu(String cbu) { this.cbu = cbu; }

    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }

    public String getBankOrWalletName() { return bankOrWalletName; }
    public void setBankOrWalletName(String bankOrWalletName) { this.bankOrWalletName = bankOrWalletName; }

    public String getAccountHolderName() { return accountHolderName; }
    public void setAccountHolderName(String accountHolderName) { this.accountHolderName = accountHolderName; }
}

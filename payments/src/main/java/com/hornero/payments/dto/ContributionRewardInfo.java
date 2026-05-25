package com.hornero.payments.dto;

import java.math.BigDecimal;

public class ContributionRewardInfo {

    private Long rewardId;
    private BigDecimal rewardPrice;
    private Long previousRewardId;
    private BigDecimal previousRewardPrice;

    public ContributionRewardInfo(Long rewardId, BigDecimal rewardPrice, Long previousRewardId, BigDecimal previousRewardPrice) {
        this.rewardId = rewardId;
        this.rewardPrice = rewardPrice;
        this.previousRewardId = previousRewardId;
        this.previousRewardPrice = previousRewardPrice;
    }

    public Long getRewardId() { return rewardId; }
    public BigDecimal getRewardPrice() { return rewardPrice; }
    public Long getPreviousRewardId() { return previousRewardId; }
    public BigDecimal getPreviousRewardPrice() { return previousRewardPrice; }
}

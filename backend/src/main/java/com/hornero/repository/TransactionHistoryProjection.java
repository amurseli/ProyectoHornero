package com.hornero.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface TransactionHistoryProjection {
    Long getContributionId();
    Long getCampaignId();
    String getCampaignTitle();
    BigDecimal getAmount();
    String getContributionStatus();
    Long getTransactionId();
    String getTransactionMethod();
    String getPaymentProvider();
    String getExternalTransactionId();
    String getHashTx();
    LocalDateTime getCreatedAt();
}

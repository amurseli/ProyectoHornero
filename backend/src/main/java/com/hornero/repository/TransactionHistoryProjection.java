package com.hornero.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface TransactionHistoryProjection {
    String getHistoryType();
    Long getContributionId();
    Long getCampaignId();
    String getCampaignTitle();
    BigDecimal getAmount();
    String getEntryStatus();
    Long getTransactionId();
    String getTransactionMethod();
    String getPaymentProvider();
    String getSenderLabel();
    String getRecipientLabel();
    String getReference();
    String getHashTx();
    LocalDateTime getCreatedAt();
    String getOperationNumber();
}

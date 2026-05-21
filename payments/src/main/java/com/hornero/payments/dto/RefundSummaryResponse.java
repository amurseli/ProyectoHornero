package com.hornero.payments.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class RefundSummaryResponse {

    private Long campaignId;
    private String reason;
    private int total;
    private int completed;
    private int failed;
    private List<RefundInfo> refunds;

    public RefundSummaryResponse(Long campaignId, String reason, List<RefundInfo> refunds) {
        this.campaignId = campaignId;
        this.reason = reason;
        this.refunds = refunds;
        this.total = refunds.size();
        this.completed = (int) refunds.stream().filter(r -> "COMPLETED".equals(r.getStatus())).count();
        this.failed = (int) refunds.stream().filter(r -> "FAILED".equals(r.getStatus())).count();
    }

    public Long getCampaignId() { return campaignId; }
    public String getReason() { return reason; }
    public int getTotal() { return total; }
    public int getCompleted() { return completed; }
    public int getFailed() { return failed; }
    public List<RefundInfo> getRefunds() { return refunds; }

    public static class RefundInfo {
        private Long refundId;
        private Long contributionId;
        private BigDecimal amount;
        private String status;
        private String idRefundExternal;
        private LocalDateTime processedAt;

        public RefundInfo(Long refundId, Long contributionId, BigDecimal amount,
                          String status, String idRefundExternal, LocalDateTime processedAt) {
            this.refundId = refundId;
            this.contributionId = contributionId;
            this.amount = amount;
            this.status = status;
            this.idRefundExternal = idRefundExternal;
            this.processedAt = processedAt;
        }

        public Long getRefundId() { return refundId; }
        public Long getContributionId() { return contributionId; }
        public BigDecimal getAmount() { return amount; }
        public String getStatus() { return status; }
        public String getIdRefundExternal() { return idRefundExternal; }
        public LocalDateTime getProcessedAt() { return processedAt; }
    }
}

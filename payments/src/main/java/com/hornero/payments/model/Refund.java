package com.hornero.payments.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "refund", schema = "payments")
public class Refund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_contribution", nullable = false)
    private Contribution contribution;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_provider", nullable = false, length = 30)
    private String paymentProvider;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";
    // PENDING | COMPLETED | FAILED

    @Column(name = "id_refund_external", length = 50)
    private String idRefundExternal;

    @Column(name = "hash_tx", length = 120)
    private String hashTx;

    @Column(nullable = false, length = 50)
    private String reason;
    // CAMPAIGN_FAILED | CAMPAIGN_CANCELLED

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public Contribution getContribution() { return contribution; }
    public BigDecimal getAmount() { return amount; }
    public String getPaymentProvider() { return paymentProvider; }
    public String getStatus() { return status; }
    public String getIdRefundExternal() { return idRefundExternal; }
    public String getHashTx() { return hashTx; }
    public String getReason() { return reason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getProcessedAt() { return processedAt; }

    // Setters
    public void setContribution(Contribution contribution) { this.contribution = contribution; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }
    public void setStatus(String status) { this.status = status; }
    public void setIdRefundExternal(String idRefundExternal) { this.idRefundExternal = idRefundExternal; }
    public void setHashTx(String hashTx) { this.hashTx = hashTx; }
    public void setReason(String reason) { this.reason = reason; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }
}

package com.hornero.payments.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction", schema = "payments")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_contribution", nullable = false)
    private Contribution contribution;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_method", nullable = false, length = 30)
    private String transactionMethod;

    @Column(name = "cbu_origin", length = 50)
    private String cbuOrigin;

    @Column(name = "cbu_destination", length = 50)
    private String cbuDestination;

    @Column(name = "id_transaction_external", length = 50)
    private String idTransactionExternal;

    @Column(name = "payment_provider", nullable = false, length = 30)
    private String paymentProvider;

    @Column(name = "hash_tx", length = 120)
    private String hashTx;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public Contribution getContribution() { return contribution; }
    public BigDecimal getAmount() { return amount; }
    public String getTransactionMethod() { return transactionMethod; }
    public String getCbuOrigin() { return cbuOrigin; }
    public String getCbuDestination() { return cbuDestination; }
    public String getIdTransactionExternal() { return idTransactionExternal; }
    public String getPaymentProvider() { return paymentProvider; }
    public String getHashTx() { return hashTx; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setContribution(Contribution contribution) { this.contribution = contribution; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setTransactionMethod(String transactionMethod) { this.transactionMethod = transactionMethod; }
    public void setCbuOrigin(String cbuOrigin) { this.cbuOrigin = cbuOrigin; }
    public void setCbuDestination(String cbuDestination) { this.cbuDestination = cbuDestination; }
    public void setIdTransactionExternal(String idTransactionExternal) { this.idTransactionExternal = idTransactionExternal; }
    public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }
    public void setHashTx(String hashTx) { this.hashTx = hashTx; }
}

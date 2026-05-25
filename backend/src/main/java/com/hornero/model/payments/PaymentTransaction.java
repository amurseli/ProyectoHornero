package com.hornero.model.payments;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction", schema = "payments")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_contribution", nullable = false)
    private PaymentContribution contribution;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_method", nullable = false, length = 30)
    private String transactionMethod;

    @Column(name = "CBU_origin", length = 50)
    private String cbuOrigin;

    @Column(name = "CBU_destination", length = 50)
    private String cbuDestination;

    @Column(name = "id_transaction_external", length = 50)
    private String idTransactionExternal;

    @Column(name = "payment_provider", nullable = false, length = 30)
    private String paymentProvider;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public PaymentContribution getContribution() { return contribution; }
    public BigDecimal getAmount() { return amount; }
    public String getTransactionMethod() { return transactionMethod; }
    public String getCbuOrigin() { return cbuOrigin; }
    public String getCbuDestination() { return cbuDestination; }
    public String getIdTransactionExternal() { return idTransactionExternal; }
    public String getPaymentProvider() { return paymentProvider; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

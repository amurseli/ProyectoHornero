package com.hornero.model.payments;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Read-only POJO mirroring rows from the payments.transaction table, owned by
// the payments microservice. See PaymentContribution for context.
public class PaymentTransaction {

    private Long id;
    private PaymentContribution contribution;
    private BigDecimal amount;
    private String transactionMethod;
    private String cbuOrigin;
    private String cbuDestination;
    private String idTransactionExternal;
    private String paymentProvider;
    private String hashTx;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public PaymentContribution getContribution() { return contribution; }
    public BigDecimal getAmount() { return amount; }
    public String getTransactionMethod() { return transactionMethod; }
    public String getCbuOrigin() { return cbuOrigin; }
    public String getCbuDestination() { return cbuDestination; }
    public String getIdTransactionExternal() { return idTransactionExternal; }
    public String getPaymentProvider() { return paymentProvider; }
    public String getHashTx() { return hashTx; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setContribution(PaymentContribution contribution) { this.contribution = contribution; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setTransactionMethod(String transactionMethod) { this.transactionMethod = transactionMethod; }
    public void setCbuOrigin(String cbuOrigin) { this.cbuOrigin = cbuOrigin; }
    public void setCbuDestination(String cbuDestination) { this.cbuDestination = cbuDestination; }
    public void setIdTransactionExternal(String idTransactionExternal) { this.idTransactionExternal = idTransactionExternal; }
    public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }
    public void setHashTx(String hashTx) { this.hashTx = hashTx; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

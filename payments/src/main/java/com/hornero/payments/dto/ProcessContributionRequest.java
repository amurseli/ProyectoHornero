package com.hornero.payments.dto;

public class ProcessContributionRequest {

    // Datos que provee el Payment Brick de MercadoPago al submit
    private String paymentType; // "credit_card", "debit_card", "wallet_purchase", etc.
    private Long paymentId;     // solo presente en wallet_purchase
    private String token;
    private String paymentMethodId;
    private String issuerId;
    private Integer installments;
    private String payerEmail;
    private String identificationType;
    private String identificationNumber;

    public String getPaymentType() { return paymentType; }
    public void setPaymentType(String paymentType) { this.paymentType = paymentType; }

    public Long getPaymentId() { return paymentId; }
    public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getPaymentMethodId() { return paymentMethodId; }
    public void setPaymentMethodId(String paymentMethodId) { this.paymentMethodId = paymentMethodId; }

    public String getIssuerId() { return issuerId; }
    public void setIssuerId(String issuerId) { this.issuerId = issuerId; }

    public Integer getInstallments() { return installments; }
    public void setInstallments(Integer installments) { this.installments = installments; }

    public String getPayerEmail() { return payerEmail; }
    public void setPayerEmail(String payerEmail) { this.payerEmail = payerEmail; }

    public String getIdentificationType() { return identificationType; }
    public void setIdentificationType(String identificationType) { this.identificationType = identificationType; }

    public String getIdentificationNumber() { return identificationNumber; }
    public void setIdentificationNumber(String identificationNumber) { this.identificationNumber = identificationNumber; }
}

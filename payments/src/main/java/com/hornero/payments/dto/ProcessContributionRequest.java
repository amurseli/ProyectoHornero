package com.hornero.payments.dto;

public class ProcessContributionRequest {

    // Datos que provee el Payment Brick de MercadoPago al submit
    private String token;
    private String paymentMethodId;
    private String issuerId;
    private Integer installments;
    private String payerEmail;
    private String identificationType;
    private String identificationNumber;

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

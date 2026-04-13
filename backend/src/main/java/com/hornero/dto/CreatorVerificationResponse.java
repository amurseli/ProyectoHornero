package com.hornero.dto;

import com.hornero.model.CreatorBankInfo;
import com.hornero.model.CreatorIdentityDocument;
import com.hornero.model.CreatorVerification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class CreatorVerificationResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String email;
    private String fullLegalName;
    private String dniNumberMasked;
    private String cuilNumberMasked;
    private String cuitNumberMasked;
    private LocalDate dateOfBirth;
    private String phoneNumber;
    private String addressStreet;
    private String addressCity;
    private String addressProvince;
    private String addressZipCode;
    private String taxCondition;
    private String verificationStatus;
    private String rejectionReason;
    private LocalDateTime verifiedAt;
    private String verifiedBy;
    private Boolean termsAccepted;
    private LocalDateTime createdAt;

    // Bank info
    private String accountType;
    private String accountNumberMasked;
    private String accountAlias;
    private String bankOrWalletName;
    private String accountHolderName;

    // Documents
    private List<DocumentInfo> documents;

    public static class DocumentInfo {
        private Long id;
        private String documentType;
        private LocalDateTime uploadedAt;

        public DocumentInfo(Long id, String documentType, LocalDateTime uploadedAt) {
            this.id = id;
            this.documentType = documentType;
            this.uploadedAt = uploadedAt;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getDocumentType() { return documentType; }
        public void setDocumentType(String documentType) { this.documentType = documentType; }
        public LocalDateTime getUploadedAt() { return uploadedAt; }
        public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
    }

    /**
     * Build a response masking sensitive data (for the creator themselves).
     */
    public static CreatorVerificationResponse fromEntities(
            CreatorVerification verification,
            CreatorBankInfo bankInfo,
            List<CreatorIdentityDocument> documents) {

        CreatorVerificationResponse resp = new CreatorVerificationResponse();
        resp.id = verification.getId();
        resp.userId = verification.getUser().getId();
        resp.userName = verification.getUser().getUserName();
        resp.email = verification.getUser().getEmail();
        resp.fullLegalName = verification.getFullLegalName();
        resp.dniNumberMasked = maskValue(verification.getDniNumber());
        resp.cuilNumberMasked = maskValue(verification.getCuilNumber());
        resp.cuitNumberMasked = verification.getCuitNumber() != null ? maskValue(verification.getCuitNumber()) : null;
        resp.dateOfBirth = verification.getDateOfBirth();
        resp.phoneNumber = verification.getPhoneNumber();
        resp.addressStreet = verification.getAddressStreet();
        resp.addressCity = verification.getAddressCity();
        resp.addressProvince = verification.getAddressProvince();
        resp.addressZipCode = verification.getAddressZipCode();
        resp.taxCondition = verification.getTaxCondition().name();
        resp.verificationStatus = verification.getVerificationStatus().name();
        resp.rejectionReason = verification.getRejectionReason();
        resp.verifiedAt = verification.getVerifiedAt();
        resp.verifiedBy = verification.getVerifiedBy();
        resp.termsAccepted = verification.getTermsAccepted();
        resp.createdAt = verification.getCreatedAt();

        if (bankInfo != null) {
            resp.accountType = bankInfo.getAccountType().name();
            resp.accountNumberMasked = maskValue(bankInfo.getAccountNumber());
            resp.accountAlias = bankInfo.getAccountAlias();
            resp.bankOrWalletName = bankInfo.getBankOrWalletName();
            resp.accountHolderName = bankInfo.getAccountHolderName();
        }

        if (documents != null) {
            resp.documents = documents.stream()
                    .map(d -> new DocumentInfo(d.getId(), d.getDocumentType().name(), d.getUploadedAt()))
                    .collect(Collectors.toList());
        }

        return resp;
    }

    /**
     * Build a full response for admin review (unmasked sensitive fields).
     */
    public static CreatorVerificationResponse forAdmin(
            CreatorVerification verification,
            CreatorBankInfo bankInfo,
            List<CreatorIdentityDocument> documents) {

        CreatorVerificationResponse resp = fromEntities(verification, bankInfo, documents);
        // For admin: show full values
        resp.dniNumberMasked = verification.getDniNumber();
        resp.cuilNumberMasked = verification.getCuilNumber();
        resp.cuitNumberMasked = verification.getCuitNumber();
        if (bankInfo != null) {
            resp.accountNumberMasked = bankInfo.getAccountNumber();
        }
        return resp;
    }

    private static String maskValue(String value) {
        if (value == null || value.length() <= 4) return "****";
        return "*".repeat(value.length() - 4) + value.substring(value.length() - 4);
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullLegalName() { return fullLegalName; }
    public void setFullLegalName(String fullLegalName) { this.fullLegalName = fullLegalName; }

    public String getDniNumberMasked() { return dniNumberMasked; }
    public void setDniNumberMasked(String dniNumberMasked) { this.dniNumberMasked = dniNumberMasked; }

    public String getCuilNumberMasked() { return cuilNumberMasked; }
    public void setCuilNumberMasked(String cuilNumberMasked) { this.cuilNumberMasked = cuilNumberMasked; }

    public String getCuitNumberMasked() { return cuitNumberMasked; }
    public void setCuitNumberMasked(String cuitNumberMasked) { this.cuitNumberMasked = cuitNumberMasked; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getAddressStreet() { return addressStreet; }
    public void setAddressStreet(String addressStreet) { this.addressStreet = addressStreet; }

    public String getAddressCity() { return addressCity; }
    public void setAddressCity(String addressCity) { this.addressCity = addressCity; }

    public String getAddressProvince() { return addressProvince; }
    public void setAddressProvince(String addressProvince) { this.addressProvince = addressProvince; }

    public String getAddressZipCode() { return addressZipCode; }
    public void setAddressZipCode(String addressZipCode) { this.addressZipCode = addressZipCode; }

    public String getTaxCondition() { return taxCondition; }
    public void setTaxCondition(String taxCondition) { this.taxCondition = taxCondition; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public Boolean getTermsAccepted() { return termsAccepted; }
    public void setTermsAccepted(Boolean termsAccepted) { this.termsAccepted = termsAccepted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public String getAccountNumberMasked() { return accountNumberMasked; }
    public void setAccountNumberMasked(String accountNumberMasked) { this.accountNumberMasked = accountNumberMasked; }

    public String getAccountAlias() { return accountAlias; }
    public void setAccountAlias(String accountAlias) { this.accountAlias = accountAlias; }

    public String getBankOrWalletName() { return bankOrWalletName; }
    public void setBankOrWalletName(String bankOrWalletName) { this.bankOrWalletName = bankOrWalletName; }

    public String getAccountHolderName() { return accountHolderName; }
    public void setAccountHolderName(String accountHolderName) { this.accountHolderName = accountHolderName; }

    public List<DocumentInfo> getDocuments() { return documents; }
    public void setDocuments(List<DocumentInfo> documents) { this.documents = documents; }
}

package com.hornero.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "creator_verification")
public class CreatorVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "full_legal_name", nullable = false)
    private String fullLegalName;

    @Column(name = "dni_number", nullable = false)
    private String dniNumber;

    @Column(name = "cuil_number", nullable = false)
    private String cuilNumber;

    @Column(name = "cuit_number")
    private String cuitNumber;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(name = "address_street", nullable = false)
    private String addressStreet;

    @Column(name = "address_city", nullable = false)
    private String addressCity;

    @Column(name = "address_province", nullable = false)
    private String addressProvince;

    @Column(name = "address_zip_code", nullable = false)
    private String addressZipCode;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "tax_condition", nullable = false, columnDefinition = "tax_condition")
    private TaxCondition taxCondition;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "verification_status", nullable = false, columnDefinition = "verification_status")
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verified_by")
    private String verifiedBy;

    @Column(name = "terms_accepted", nullable = false)
    private Boolean termsAccepted = false;

    @Column(name = "terms_accepted_at")
    private LocalDateTime termsAcceptedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Enums
    public enum TaxCondition {
        MONOTRIBUTISTA, RESPONSABLE_INSCRIPTO, CONSUMIDOR_FINAL, EXENTO
    }

    public enum VerificationStatus {
        PENDING, APPROVED, REJECTED
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getFullLegalName() { return fullLegalName; }
    public void setFullLegalName(String fullLegalName) { this.fullLegalName = fullLegalName; }

    public String getDniNumber() { return dniNumber; }
    public void setDniNumber(String dniNumber) { this.dniNumber = dniNumber; }

    public String getCuilNumber() { return cuilNumber; }
    public void setCuilNumber(String cuilNumber) { this.cuilNumber = cuilNumber; }

    public String getCuitNumber() { return cuitNumber; }
    public void setCuitNumber(String cuitNumber) { this.cuitNumber = cuitNumber; }

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

    public TaxCondition getTaxCondition() { return taxCondition; }
    public void setTaxCondition(TaxCondition taxCondition) { this.taxCondition = taxCondition; }

    public VerificationStatus getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(VerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public Boolean getTermsAccepted() { return termsAccepted; }
    public void setTermsAccepted(Boolean termsAccepted) { this.termsAccepted = termsAccepted; }

    public LocalDateTime getTermsAcceptedAt() { return termsAcceptedAt; }
    public void setTermsAcceptedAt(LocalDateTime termsAcceptedAt) { this.termsAcceptedAt = termsAcceptedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

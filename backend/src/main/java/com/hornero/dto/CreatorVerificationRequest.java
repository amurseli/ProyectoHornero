package com.hornero.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class CreatorVerificationRequest {

    @NotBlank(message = "El nombre legal completo es obligatorio")
    @Size(max = 255, message = "El nombre legal no puede superar los 255 caracteres")
    private String fullLegalName;

    @NotBlank(message = "El número de DNI es obligatorio")
    @Pattern(regexp = "^\\d{7,8}$", message = "El DNI debe tener 7 u 8 dígitos")
    private String dniNumber;

    @NotBlank(message = "El número de CUIL es obligatorio")
    @Pattern(regexp = "^\\d{11}$", message = "El CUIL debe tener 11 dígitos")
    private String cuilNumber;

    @Pattern(regexp = "^(\\d{11})?$", message = "El CUIT debe tener 11 dígitos")
    private String cuitNumber;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    @Past(message = "La fecha de nacimiento debe ser en el pasado")
    private LocalDate dateOfBirth;

    @NotBlank(message = "El teléfono es obligatorio")
    @Size(max = 30, message = "El teléfono no puede superar los 30 caracteres")
    private String phoneNumber;

    @NotBlank(message = "La dirección es obligatoria")
    @Size(max = 255, message = "La dirección no puede superar los 255 caracteres")
    private String addressStreet;

    @NotBlank(message = "La ciudad es obligatoria")
    @Size(max = 100, message = "La ciudad no puede superar los 100 caracteres")
    private String addressCity;

    @NotBlank(message = "La provincia es obligatoria")
    @Size(max = 100, message = "La provincia no puede superar los 100 caracteres")
    private String addressProvince;

    @NotBlank(message = "El código postal es obligatorio")
    @Size(max = 20, message = "El código postal no puede superar los 20 caracteres")
    private String addressZipCode;

    @NotNull(message = "La condición fiscal es obligatoria")
    private String taxCondition;

    // Bank info
    @NotNull(message = "El tipo de cuenta es obligatorio")
    private String accountType;

    @NotBlank(message = "El número de cuenta es obligatorio")
    @Pattern(regexp = "^\\d{22}$", message = "El CBU/CVU debe tener 22 dígitos")
    private String accountNumber;

    @Size(max = 100, message = "El alias no puede superar los 100 caracteres")
    private String accountAlias;

    @NotBlank(message = "El nombre del banco o billetera es obligatorio")
    @Size(max = 100, message = "El banco o billetera no puede superar los 100 caracteres")
    private String bankOrWalletName;

    @NotBlank(message = "El nombre del titular es obligatorio")
    @Size(max = 255, message = "El titular de la cuenta no puede superar los 255 caracteres")
    private String accountHolderName;

    @NotNull(message = "Debe aceptar los términos y condiciones")
    private Boolean termsAccepted;

    // Getters and Setters
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

    public String getTaxCondition() { return taxCondition; }
    public void setTaxCondition(String taxCondition) { this.taxCondition = taxCondition; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getAccountAlias() { return accountAlias; }
    public void setAccountAlias(String accountAlias) { this.accountAlias = accountAlias; }

    public String getBankOrWalletName() { return bankOrWalletName; }
    public void setBankOrWalletName(String bankOrWalletName) { this.bankOrWalletName = bankOrWalletName; }

    public String getAccountHolderName() { return accountHolderName; }
    public void setAccountHolderName(String accountHolderName) { this.accountHolderName = accountHolderName; }

    public Boolean getTermsAccepted() { return termsAccepted; }
    public void setTermsAccepted(Boolean termsAccepted) { this.termsAccepted = termsAccepted; }
}

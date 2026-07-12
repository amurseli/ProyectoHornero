package com.hornero.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class BankInfoRequest {

    @NotBlank(message = "El tipo de cuenta es obligatorio")
    private String accountType;

    @NotBlank(message = "El CBU/CVU es obligatorio")
    @Pattern(regexp = "^\\d{22}$", message = "El CBU/CVU debe tener 22 dígitos")
    private String accountNumber;

    @Size(max = 100, message = "El alias no puede superar los 100 caracteres")
    private String accountAlias;

    @NotBlank(message = "El banco o billetera es obligatorio")
    @Size(max = 100, message = "El banco o billetera no puede superar los 100 caracteres")
    private String bankOrWalletName;

    @NotBlank(message = "El titular de la cuenta es obligatorio")
    @Size(max = 255, message = "El titular de la cuenta no puede superar los 255 caracteres")
    private String accountHolderName;

    // Confirmación: exactamente una de las dos, validado en el service (no acá con
    // @NotBlank) porque el usuario elige uno de los dos métodos en el modal.
    private String currentPassword;
    private String confirmationCode;

    public BankInfoRequest() {}

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

    public String getCurrentPassword() { return currentPassword; }
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }

    public String getConfirmationCode() { return confirmationCode; }
    public void setConfirmationCode(String confirmationCode) { this.confirmationCode = confirmationCode; }
}

package com.hornero.dto;

import jakarta.validation.constraints.NotBlank;

public class BankInfoRequest {

    @NotBlank(message = "El tipo de cuenta es obligatorio")
    private String accountType;

    @NotBlank(message = "El CBU/CVU es obligatorio")
    private String accountNumber;

    private String accountAlias;

    @NotBlank(message = "El banco o billetera es obligatorio")
    private String bankOrWalletName;

    @NotBlank(message = "El titular de la cuenta es obligatorio")
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

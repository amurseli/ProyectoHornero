package com.hornero.dto;

import java.time.LocalDateTime;

public class BankInfoResponse {

    private String accountType;
    private String accountNumber;
    private String accountAlias;
    private String bankOrWalletName;
    private String accountHolderName;
    private LocalDateTime updatedAt;

    public BankInfoResponse() {}

    public BankInfoResponse(String accountType, String accountNumber, String accountAlias,
                             String bankOrWalletName, String accountHolderName, LocalDateTime updatedAt) {
        this.accountType = accountType;
        this.accountNumber = accountNumber;
        this.accountAlias = accountAlias;
        this.bankOrWalletName = bankOrWalletName;
        this.accountHolderName = accountHolderName;
        this.updatedAt = updatedAt;
    }

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

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

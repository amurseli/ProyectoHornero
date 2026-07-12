package com.hornero.dto;

import com.hornero.validation.StrongPassword;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChangePasswordRequest {
    private String currentPassword;

    @NotBlank(message = "La contraseña es obligatoria")
    @StrongPassword
    @Size(max = 72, message = "La contraseña no puede superar los 72 caracteres")
    private String newPassword;

    public ChangePasswordRequest() {}

    public String getCurrentPassword() { return currentPassword; }
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}

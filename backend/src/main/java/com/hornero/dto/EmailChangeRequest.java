package com.hornero.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class EmailChangeRequest {
    @NotBlank(message = "El nuevo email es obligatorio")
    @Email(message = "El correo electrónico no es válido")
    @Size(max = 255, message = "El correo electrónico no puede superar los 255 caracteres")
    private String newEmail;

    public EmailChangeRequest() {}

    public String getNewEmail() { return newEmail; }
    public void setNewEmail(String newEmail) { this.newEmail = newEmail; }
}

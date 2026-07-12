package com.hornero.dto;

import com.hornero.validation.StrongPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @Size(max = 50, message = "El nombre de usuario no puede superar los 50 caracteres")
    private String userName;

    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    private String firstName;

    @Size(max = 100, message = "El apellido no puede superar los 100 caracteres")
    private String lastName;

    @Email(message = "El correo electrónico no es válido")
    @Size(max = 255, message = "El correo electrónico no puede superar los 255 caracteres")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @StrongPassword
    @Size(max = 72, message = "La contraseña no puede superar los 72 caracteres")
    private String password;

    private Boolean enabled;

    public RegisterRequest() {}

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
}

package com.hornero.dto;

public class LoginRequest {
    private String email;
    private String password;
    private Boolean remember;

    public LoginRequest() {}

    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Boolean getRemember() { return remember; }
    public void setRemember(Boolean remember) { this.remember = remember; }
}

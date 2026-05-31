package com.hornero.dto;

public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private Long userId;
    private String email;
    private String userName;
    private String firstName;
    private String role;
    private String avatarUrl;

    public AuthResponse() {}

    public AuthResponse(String token, Long userId, String email, String userName, String firstName, String role, String avatarUrl) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.userName = userName;
        this.firstName = firstName;
        this.role = role;
        this.avatarUrl = avatarUrl;
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}

package com.hornero.dto;

public class ProfileResponse {
    private Long userId;
    private String email;
    private String pendingEmail;
    private String userName;
    private String firstName;
    private String lastName;
    private String gender;
    private String phone;
    private String role;
    private String oauthProvider;
    private String avatarUrl;
    private String avatarSource;

    public ProfileResponse() {}

    public ProfileResponse(Long userId, String email, String pendingEmail, String userName,
                           String firstName, String lastName, String gender, String phone,
                           String role, String oauthProvider, String avatarUrl, String avatarSource) {
        this.userId = userId;
        this.email = email;
        this.pendingEmail = pendingEmail;
        this.userName = userName;
        this.firstName = firstName;
        this.lastName = lastName;
        this.gender = gender;
        this.phone = phone;
        this.role = role;
        this.oauthProvider = oauthProvider;
        this.avatarUrl = avatarUrl;
        this.avatarSource = avatarSource;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPendingEmail() { return pendingEmail; }
    public void setPendingEmail(String pendingEmail) { this.pendingEmail = pendingEmail; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getOauthProvider() { return oauthProvider; }
    public void setOauthProvider(String oauthProvider) { this.oauthProvider = oauthProvider; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getAvatarSource() { return avatarSource; }
    public void setAvatarSource(String avatarSource) { this.avatarSource = avatarSource; }
}

package com.hornero.dto;

public class UpdateProfileRequest {
    private String userName;
    private String firstName;
    private String lastName;
    private String gender;
    private String phone;
    private String avatarBase64;
    private Boolean removeAvatar;

    public UpdateProfileRequest() {}

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

    public String getAvatarBase64() { return avatarBase64; }
    public void setAvatarBase64(String avatarBase64) { this.avatarBase64 = avatarBase64; }

    public Boolean getRemoveAvatar() { return removeAvatar; }
    public void setRemoveAvatar(Boolean removeAvatar) { this.removeAvatar = removeAvatar; }
}

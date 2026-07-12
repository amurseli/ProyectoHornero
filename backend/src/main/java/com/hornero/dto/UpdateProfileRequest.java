package com.hornero.dto;

import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {
    @Size(max = 50, message = "El nombre de usuario no puede superar los 50 caracteres")
    private String userName;

    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    private String firstName;

    @Size(max = 100, message = "El apellido no puede superar los 100 caracteres")
    private String lastName;

    @Size(max = 20, message = "El género no puede superar los 20 caracteres")
    private String gender;

    @Size(max = 30, message = "El teléfono no puede superar los 30 caracteres")
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

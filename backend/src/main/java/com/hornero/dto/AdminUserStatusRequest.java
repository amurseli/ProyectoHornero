package com.hornero.dto;

import jakarta.validation.constraints.NotNull;

public class AdminUserStatusRequest {
    @NotNull(message = "El estado enabled es obligatorio")
    private Boolean enabled;

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}

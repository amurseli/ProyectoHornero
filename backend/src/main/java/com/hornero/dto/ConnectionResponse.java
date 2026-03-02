package com.hornero.dto;

public class ConnectionResponse {
    private String provider;
    private String providerEmail;
    private boolean linked;

    public ConnectionResponse() {}

    public ConnectionResponse(String provider, String providerEmail, boolean linked) {
        this.provider = provider;
        this.providerEmail = providerEmail;
        this.linked = linked;
    }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getProviderEmail() { return providerEmail; }
    public void setProviderEmail(String providerEmail) { this.providerEmail = providerEmail; }

    public boolean isLinked() { return linked; }
    public void setLinked(boolean linked) { this.linked = linked; }
}

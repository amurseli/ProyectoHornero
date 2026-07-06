package com.hornero.dto;

import java.math.BigDecimal;

public class PublicFeeRatesResponse {

    private BigDecimal platformRate;
    private BigDecimal providerRate;

    public PublicFeeRatesResponse() {}

    public PublicFeeRatesResponse(BigDecimal platformRate, BigDecimal providerRate) {
        this.platformRate = platformRate;
        this.providerRate = providerRate;
    }

    public BigDecimal getPlatformRate() { return platformRate; }
    public void setPlatformRate(BigDecimal platformRate) { this.platformRate = platformRate; }

    public BigDecimal getProviderRate() { return providerRate; }
    public void setProviderRate(BigDecimal providerRate) { this.providerRate = providerRate; }
}

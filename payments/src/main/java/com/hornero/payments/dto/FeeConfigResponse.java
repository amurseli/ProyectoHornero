package com.hornero.payments.dto;

import com.hornero.payments.model.FeeConfig;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FeeConfigResponse(
        Long id,
        BigDecimal platformRate,
        BigDecimal providerRate,
        Long updatedByUserId,
        LocalDateTime createdAt
) {
    public static FeeConfigResponse fromEntity(FeeConfig feeConfig) {
        return new FeeConfigResponse(
                feeConfig.getId(),
                feeConfig.getPlatformRate(),
                feeConfig.getProviderRate(),
                feeConfig.getUpdatedByUserId(),
                feeConfig.getCreatedAt()
        );
    }
}

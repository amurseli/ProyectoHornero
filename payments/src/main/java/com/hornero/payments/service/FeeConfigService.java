package com.hornero.payments.service;

import com.hornero.payments.model.FeeConfig;
import com.hornero.payments.repository.FeeConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class FeeConfigService {

    private final FeeConfigRepository feeConfigRepository;

    public FeeConfigService(FeeConfigRepository feeConfigRepository) {
        this.feeConfigRepository = feeConfigRepository;
    }

    // Registro append-only: nunca se actualiza ni borra una fila existente, siempre
    // se inserta una nueva. La tasa vigente es la de mayor id. Así se preserva el
    // historial completo de cambios sin afectar los payouts ya calculados.
    public FeeConfig getCurrentConfig() {
        return feeConfigRepository.findTopByOrderByIdDesc()
                .orElseThrow(() -> new IllegalStateException("No hay configuración de comisiones registrada"));
    }

    @Transactional
    public FeeConfig updateRates(BigDecimal platformRate, BigDecimal providerRate, Long updatedByUserId) {
        validateRate(platformRate, "platformRate");
        validateRate(providerRate, "providerRate");
        if (platformRate.add(providerRate).compareTo(BigDecimal.ONE) >= 0) {
            throw new IllegalArgumentException("La suma de platformRate y providerRate debe ser menor a 1");
        }

        FeeConfig feeConfig = new FeeConfig();
        feeConfig.setPlatformRate(platformRate);
        feeConfig.setProviderRate(providerRate);
        feeConfig.setUpdatedByUserId(updatedByUserId);
        return feeConfigRepository.save(feeConfig);
    }

    private void validateRate(BigDecimal rate, String fieldName) {
        if (rate == null || rate.compareTo(BigDecimal.ZERO) < 0 || rate.compareTo(BigDecimal.ONE) >= 0) {
            throw new IllegalArgumentException(fieldName + " debe estar entre 0 (inclusive) y 1 (exclusive)");
        }
    }
}

package com.hornero.payments.controller;

import com.hornero.payments.dto.FeeConfigResponse;
import com.hornero.payments.service.FeeConfigService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/internal/payments/fee-config")
public class FeeConfigController {

    private final FeeConfigService feeConfigService;

    @Value("${app.service-key}")
    private String serviceKey;

    public FeeConfigController(FeeConfigService feeConfigService) {
        this.feeConfigService = feeConfigService;
    }

    @GetMapping
    public ResponseEntity<FeeConfigResponse> getCurrentConfig(@RequestHeader("X-Service-Key") String incomingKey) {
        validateServiceKey(incomingKey);
        return ResponseEntity.ok(FeeConfigResponse.fromEntity(feeConfigService.getCurrentConfig()));
    }

    @PutMapping
    public ResponseEntity<FeeConfigResponse> updateRates(
            @RequestBody Map<String, Object> body,
            @RequestHeader("X-Service-Key") String incomingKey) {

        validateServiceKey(incomingKey);
        BigDecimal platformRate = parseRate(body.get("platformRate"), "platformRate");
        BigDecimal providerRate = parseRate(body.get("providerRate"), "providerRate");
        Long updatedByUserId = parseUserId(body.get("updatedByUserId"));

        return ResponseEntity.ok(FeeConfigResponse.fromEntity(
                feeConfigService.updateRates(platformRate, providerRate, updatedByUserId)));
    }

    private void validateServiceKey(String incomingKey) {
        if (!serviceKey.equals(incomingKey)) {
            throw new SecurityException("X-Service-Key inválida");
        }
    }

    private BigDecimal parseRate(Object value, String fieldName) {
        if (!(value instanceof Number number)) {
            throw new IllegalArgumentException(fieldName + " es requerido y debe ser numérico");
        }
        return new BigDecimal(number.toString());
    }

    private Long parseUserId(Object value) {
        if (!(value instanceof Number number)) {
            throw new IllegalArgumentException("updatedByUserId es requerido y debe ser numérico");
        }
        return number.longValue();
    }
}

package com.hornero.controller;

import com.hornero.client.PaymentsServiceClient;
import com.hornero.dto.ErrorResponse;
import com.hornero.dto.FeeConfigResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/fee-config")
public class AdminFeeConfigController {

    @Autowired
    private PaymentsServiceClient paymentsServiceClient;

    @GetMapping
    public ResponseEntity<?> getFeeConfig(HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN.value()));
        }

        try {
            return ResponseEntity.ok(toResponse(paymentsServiceClient.fetchFeeConfig()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_GATEWAY.value()));
        }
    }

    @PutMapping
    public ResponseEntity<?> updateFeeConfig(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN.value()));
        }

        Long actorUserId = (Long) request.getAttribute("userId");

        try {
            BigDecimal platformRate = parseRate(body.get("platformRate"), "platformRate");
            BigDecimal providerRate = parseRate(body.get("providerRate"), "providerRate");
            FeeConfigResponse updated = toResponse(
                    paymentsServiceClient.updateFeeConfig(platformRate, providerRate, actorUserId));
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_GATEWAY.value()));
        }
    }

    private BigDecimal parseRate(Object value, String fieldName) {
        if (!(value instanceof Number number)) {
            throw new IllegalArgumentException(fieldName + " es requerido y debe ser numérico");
        }
        return new BigDecimal(number.toString());
    }

    private FeeConfigResponse toResponse(PaymentsServiceClient.FeeConfigInfo info) {
        FeeConfigResponse response = new FeeConfigResponse();
        response.setId(info.getId());
        response.setPlatformRate(info.getPlatformRate());
        response.setProviderRate(info.getProviderRate());
        response.setUpdatedByUserId(info.getUpdatedByUserId());
        response.setCreatedAt(info.getCreatedAt());
        return response;
    }

    private boolean isAdmin(HttpServletRequest request) {
        return "ADMIN".equals(request.getAttribute("userRole"));
    }
}

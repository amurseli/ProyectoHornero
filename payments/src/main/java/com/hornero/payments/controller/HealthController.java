package com.hornero.payments.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller para health checks del servicio de pagos
 */
@RestController
public class HealthController {
    
    @Value("${mercadopago.access-token}")
    private String accessToken;
    
    /**
     * Health check básico
     * GET http://localhost:8081/
     */
    @GetMapping("/")
    public Map<String, Object> root() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("service", "Hornero Payments Service");
        response.put("message", "Servicio de pagos funcionando correctamente");
        response.put("timestamp", LocalDateTime.now());
        return response;
    }
    
    /**
     * Health check detallado
     * GET http://localhost:8081/api/health
     */
    @GetMapping("/api/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "payments");
        response.put("timestamp", System.currentTimeMillis());
        
        // Verificar configuración de MercadoPago
        Map<String, Object> mercadopago = new HashMap<>();
        mercadopago.put("configured", accessToken != null && !accessToken.isEmpty());
        mercadopago.put("environment", accessToken.startsWith("TEST") ? "TEST" : "PRODUCTION");
        mercadopago.put("accessTokenPrefix", accessToken.substring(0, 20) + "...");
        
        response.put("mercadopago", mercadopago);
        
        return response;
    }
}

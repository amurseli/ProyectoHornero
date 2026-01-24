package com.hornero.payments.config;

import com.mercadopago.MercadoPagoConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

/**
 * Configuración de MercadoPago SDK
 * 
 * Inicializa el SDK con el access token configurado en application.properties
 * El SDK debe inicializarse antes de cualquier llamada a la API de MercadoPago
 */
@Configuration
public class MercadoPagoConfiguration {
    
    private static final Logger logger = LoggerFactory.getLogger(MercadoPagoConfiguration.class);
    
    @Value("${mercadopago.access-token}")
    private String accessToken;
    
    @Value("${mercadopago.public-key}")
    private String publicKey;
    
    @PostConstruct
    public void init() {
        try {
            MercadoPagoConfig.setAccessToken(accessToken);
            
            logger.info("✅ MercadoPago SDK inicializado correctamente");
            logger.info("🔑 Access Token: {}...", accessToken.substring(0, 20));
            logger.info("🔑 Public Key: {}...", publicKey.substring(0, 20));
            logger.info("🌍 Ambiente: {}", accessToken.startsWith("TEST") ? "TEST" : "PRODUCCIÓN");
            
        } catch (Exception e) {
            logger.error("❌ Error al inicializar MercadoPago SDK", e);
            throw new RuntimeException("No se pudo inicializar MercadoPago SDK", e);
        }
    }
}

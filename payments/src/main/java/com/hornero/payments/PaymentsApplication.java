package com.hornero.payments;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Servicio de Pagos - Proyecto Hornero
 * 
 * Responsable de:
 * - Integración con MercadoPago
 * - Gestión de donaciones
 * - Procesamiento de webhooks
 * - Manejo de refunds
 */
@SpringBootApplication
public class PaymentsApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(PaymentsApplication.class, args);
    }
}

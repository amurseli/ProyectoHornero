package com.hornero.payments;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

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

    // Los timestamps se guardan en hora local de Argentina. Fijamos la zona de la JVM para que
    // LocalDateTime.now() use siempre America/Argentina/Buenos_Aires, sin depender de la zona
    // del contenedor donde se despliegue.
    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("America/Argentina/Buenos_Aires"));
    }

    public static void main(String[] args) {
        SpringApplication.run(PaymentsApplication.class, args);
    }
}

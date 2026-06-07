package com.hornero.notifications;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Servicio de Notificaciones - Proyecto Hornero
 *
 * Responsable de:
 * - Consumir eventos de campañas y pagos publicados por backend y payments
 * - Enviar notificaciones por correo
 * - Persistir y exponer notificaciones in-app para el frontend
 */
@SpringBootApplication
public class NotificationsApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationsApplication.class, args);
    }
}

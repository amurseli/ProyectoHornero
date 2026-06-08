package com.hornero.payments.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

// Publica eventos de dominio hacia el Redis Stream que consume el servicio de notificaciones.
//
// La publicacion es asincrona desde la perspectiva del flujo de pagos: agregar un registro
// a un stream es una operacion de microsegundos que no bloquea ni depende de que el servicio
// de notificaciones este disponible. Si llega a fallar (Redis caido), se loguea el error sin
// interrumpir el procesamiento del pago — el evento de notificacion no es critico para el negocio.
@Component
public class NotificationEventPublisher {

    private static final Logger logger = LoggerFactory.getLogger(NotificationEventPublisher.class);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.notifications.stream-key}")
    private String streamKey;

    public NotificationEventPublisher(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public void publishContributionApproved(ContributionApprovedEvent event) {
        publish("CONTRIBUTION_APPROVED", event);
    }

    public void publishPayoutCompleted(PayoutCompletedEvent event) {
        publish("PAYOUT_COMPLETED", event);
    }

    private void publish(String type, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            redisTemplate.opsForStream().add(streamKey, Map.of("type", type, "payload", json));
            logger.info("Evento '{}' publicado en stream '{}'", type, streamKey);
        } catch (Exception e) {
            logger.error("Error al publicar evento '{}' en stream '{}': {}", type, streamKey, e.getMessage(), e);
        }
    }
}

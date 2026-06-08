package com.hornero.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

// Publica eventos de dominio hacia el Redis Stream que consume el servicio de notificaciones.
//
// Agregar un registro a un stream es una operacion de microsegundos que no bloquea el flujo
// que la dispara ni depende de que el servicio de notificaciones este disponible. Si la
// publicacion falla (Redis caido), se loguea el error sin interrumpir el proceso de negocio:
// el evento de notificacion no es critico para finalizar una campaña.
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

    public void publishCampaignSucceeded(CampaignFinalizedEvent event) {
        publish("CAMPAIGN_SUCCEEDED", event);
    }

    public void publishCampaignFailed(CampaignFinalizedEvent event) {
        publish("CAMPAIGN_FAILED", event);
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

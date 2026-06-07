package com.hornero.notifications.consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;

// Punto de entrada de los eventos del Redis Stream.
//
// Solo confirma (XACK) el mensaje si el procesamiento termino sin errores. Si algo
// falla, el mensaje queda en la Pending Entries List del consumer group y Redis lo
// vuelve a entregar — el mismo evento puede llegar mas de una vez (at-least-once),
// por eso NotificationEventProcessor verifica idempotencia antes de procesar.
@Component
public class NotificationEventListener implements StreamListener<String, MapRecord<String, String, String>> {

    private static final Logger logger = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationEventProcessor processor;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.notifications.stream-key}")
    private String streamKey;

    @Value("${app.notifications.consumer-group}")
    private String consumerGroup;

    public NotificationEventListener(NotificationEventProcessor processor, StringRedisTemplate redisTemplate) {
        this.processor = processor;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void onMessage(MapRecord<String, String, String> record) {
        String eventId = record.getId().getValue();
        String type = record.getValue().get("type");
        String payload = record.getValue().get("payload");

        try {
            processor.processIfNew(eventId, type, payload);
            acknowledge(record);
        } catch (Exception e) {
            logger.error("Error procesando evento {} de tipo '{}', no se confirma (sera reintentado): {}",
                    eventId, type, e.getMessage(), e);
        }
    }

    private void acknowledge(MapRecord<String, String, String> record) {
        redisTemplate.opsForStream().acknowledge(streamKey, consumerGroup, record.getId());
    }
}

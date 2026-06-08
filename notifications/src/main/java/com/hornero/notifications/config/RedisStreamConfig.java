package com.hornero.notifications.config;

import com.hornero.notifications.consumer.NotificationEventListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

// Suscribe al servicio al stream de eventos de notificaciones via consumer group,
// lo que permite procesamiento asincrono y entrega garantizada (at-least-once):
// si el servicio esta caido, los eventos quedan en el stream hasta que vuelva a leerlos.
@Configuration
public class RedisStreamConfig {

    private static final Logger logger = LoggerFactory.getLogger(RedisStreamConfig.class);

    @Value("${app.notifications.stream-key}")
    private String streamKey;

    @Value("${app.notifications.consumer-group}")
    private String consumerGroup;

    @Bean(destroyMethod = "stop")
    public StreamMessageListenerContainer<String, MapRecord<String, String, String>> notificationsStreamContainer(
            RedisConnectionFactory connectionFactory,
            StringRedisTemplate redisTemplate,
            NotificationEventListener listener) {

        ensureStreamAndGroupExist(redisTemplate);

        StreamMessageListenerContainer.StreamMessageListenerContainerOptions<String, MapRecord<String, String, String>> options =
                StreamMessageListenerContainer.StreamMessageListenerContainerOptions.builder()
                        .pollTimeout(Duration.ofSeconds(2))
                        .build();

        StreamMessageListenerContainer<String, MapRecord<String, String, String>> container =
                StreamMessageListenerContainer.create(connectionFactory, options);

        container.receive(
                Consumer.from(consumerGroup, consumerName()),
                StreamOffset.create(streamKey, ReadOffset.lastConsumed()),
                listener
        );

        container.start();
        logger.info("Suscripcion activa al stream '{}' con consumer group '{}'", streamKey, consumerGroup);
        return container;
    }

    // XGROUP CREATE requiere que el stream ya exista. Si es la primera vez que arranca
    // el servicio (stream inexistente), se crea con un registro bootstrap que el
    // procesador reconoce como tipo desconocido y descarta sin generar notificaciones.
    // El grupo se crea desde el offset 0 para no perder eventos publicados antes de
    // que el servicio estuviera activo; en arranques posteriores ya existe (BUSYGROUP).
    private void ensureStreamAndGroupExist(StringRedisTemplate redisTemplate) {
        boolean streamExists = Boolean.TRUE.equals(redisTemplate.hasKey(streamKey));

        if (!streamExists) {
            redisTemplate.opsForStream().add(streamKey, Map.of("type", "STREAM_INIT", "payload", "{}"));
            logger.info("Stream '{}' no existia, se creo con un registro de inicializacion", streamKey);
        }

        try {
            redisTemplate.opsForStream().createGroup(streamKey, ReadOffset.from("0"), consumerGroup);
            logger.info("Consumer group '{}' creado en stream '{}'", consumerGroup, streamKey);
        } catch (Exception e) {
            logger.debug("Consumer group '{}' ya existia en stream '{}' ({})", consumerGroup, streamKey, e.getMessage());
        }
    }

    private String consumerName() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException e) {
            return "notifications-consumer-" + UUID.randomUUID();
        }
    }
}

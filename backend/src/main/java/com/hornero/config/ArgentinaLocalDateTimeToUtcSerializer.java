package com.hornero.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Los timestamps se persisten en la base como hora local de Argentina (LocalDateTime sin zona).
 * Al serializarlos en las respuestas los interpretamos en America/Argentina/Buenos_Aires y los
 * emitimos como instante UTC en ISO-8601 (con "Z"), por ejemplo "2026-06-03T02:43:55Z".
 *
 * De esta forma la base queda en hora local, la API responde siempre en UTC y el frontend hace
 * la conversión a la zona horaria del usuario.
 */
public class ArgentinaLocalDateTimeToUtcSerializer extends JsonSerializer<LocalDateTime> {

    private static final ZoneId ARGENTINA = ZoneId.of("America/Argentina/Buenos_Aires");

    @Override
    public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        Instant instant = value.atZone(ARGENTINA).toInstant();
        gen.writeString(instant.toString());
    }
}

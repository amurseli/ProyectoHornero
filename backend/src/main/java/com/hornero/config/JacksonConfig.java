package com.hornero.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Hibernate lazy loading support
        Hibernate6Module hibernate6Module = new Hibernate6Module();
        hibernate6Module.disable(Hibernate6Module.Feature.USE_TRANSIENT_ANNOTATION);
        mapper.registerModule(hibernate6Module);
        
        // Java 8 date/time support. Los LocalDateTime se guardan en hora local de Argentina;
        // al serializarlos los convertimos a UTC (ISO-8601 con "Z") para que la API responda
        // siempre en UTC y el frontend haga la conversión a la zona del usuario.
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        javaTimeModule.addSerializer(LocalDateTime.class, new ArgentinaLocalDateTimeToUtcSerializer());
        mapper.registerModule(javaTimeModule);
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        return mapper;
    }
}

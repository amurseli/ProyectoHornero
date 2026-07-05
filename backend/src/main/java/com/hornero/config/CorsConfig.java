package com.hornero.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    // Acepta uno o varios origenes separados por coma, p. ej.
    // "https://proyecto-hornero.com,https://www.proyecto-hornero.com"
    @Value("${FRONTEND_URL}")
    private String frontendUrl;

    @Value("${BACKOFFICE_URL:http://localhost:5174}")
    private String backofficeUrl;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> allowedOrigins = new ArrayList<>();
        Arrays.stream(frontendUrl.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .forEach(allowedOrigins::add);
        allowedOrigins.add(backofficeUrl.trim());

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

package com.hornero.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.ArrayList;

@Configuration
public class CorsConfig {

    @Value("${FRONTEND_URL}")
    private String frontendUrl;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowCredentials(true);

        // Build allowed origins from FRONTEND_URL env (can be comma-separated) and common dev ports
        List<String> allowed = new ArrayList<>();
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            String[] parts = frontendUrl.split(",");
            for (String p : parts) {
                allowed.add(p.trim());
            }
        }
        // Add common local dev origins (include 5173 and 5174)
        allowed.add("http://localhost:5173");
        allowed.add("http://127.0.0.1:5173");
        allowed.add("http://localhost:5174");
        allowed.add("http://127.0.0.1:5174");

        configuration.setAllowedOrigins(allowed);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}


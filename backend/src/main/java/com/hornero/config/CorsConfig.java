package com.hornero.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    private final FrontendUrlProvider frontendUrlProvider;

    private final String backofficeUrl;

    public CorsConfig(
            FrontendUrlProvider frontendUrlProvider,
            @org.springframework.beans.factory.annotation.Value("${BACKOFFICE_URL:http://localhost:5174}") String backofficeUrl
    ) {
        this.frontendUrlProvider = frontendUrlProvider;
        this.backofficeUrl = backofficeUrl;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> allowedOrigins = List.of(
                frontendUrlProvider.getFrontendUrl(),
                backofficeUrl.trim()
        );

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

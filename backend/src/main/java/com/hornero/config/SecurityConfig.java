package com.hornero.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @Autowired
    private OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {}) // Use the corsConfigurationSource bean
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .sessionFixation().none() // Disable session fixation protection (we don't use sessions)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Allow all OPTIONS requests for CORS preflight
                .requestMatchers("/api/users/register", "/api/users/login", "/api/users/logout", "/api/health/**").permitAll()
                .requestMatchers("/api/users/forgot-password", "/api/users/reset-password").permitAll() // Allow password reset endpoints without authentication
                .requestMatchers("/api/users/verify-email").permitAll() // Allow email verification without authentication
                .requestMatchers("/api/users/me/email-change/confirm").permitAll() // Allow email change confirmation via link
                .requestMatchers("/api/auth/refresh").permitAll() // Allow refresh token endpoint without authentication
                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll() // Allow OAuth2 endpoints
                .requestMatchers(HttpMethod.GET, "/api/campaigns", "/api/campaigns/**").permitAll() // Allow public access to view campaigns
                .requestMatchers(HttpMethod.PATCH, "/api/campaigns/*/current-amount").permitAll() // Endpoint interno para payments service (protegido por X-Service-Key en el controller)
                .requestMatchers(HttpMethod.PATCH, "/api/campaigns/*/money-status").permitAll() // Callback interno de payments (protegido por X-Service-Key en el controller)
                .requestMatchers("/internal/**").permitAll() // Endpoints internos del scheduler (protegidos por X-Service-Key en el controller)
                .requestMatchers("/api/users/me").authenticated() // Require authentication for /me endpoint
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2AuthenticationSuccessHandler)
                .failureHandler(oAuth2AuthenticationFailureHandler)
            )
            // For API endpoints, return 401 instead of redirecting to OAuth login
            .exceptionHandling(exceptions -> exceptions
                .defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                    new AntPathRequestMatcher("/api/**")
                )
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

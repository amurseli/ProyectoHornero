package com.hornero.blockchain.gateway.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(LedgerClientProperties.class)
public class HttpClientConfig {

    @Bean
    RestClient ledgerRestClient(RestClient.Builder builder, LedgerClientProperties properties) {
        return builder
            .baseUrl(properties.baseUrl())
            .build();
    }
}

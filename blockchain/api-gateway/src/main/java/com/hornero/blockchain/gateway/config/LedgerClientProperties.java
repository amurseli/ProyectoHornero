package com.hornero.blockchain.gateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ledger.client")
public record LedgerClientProperties(
    String baseUrl,
    String transactionsPath
) {
}

package com.hornero.blockchain.gateway.client;

import com.hornero.blockchain.gateway.config.LedgerClientProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;

@Component
public class LedgerClient {

    private final RestClient restClient;
    private final LedgerClientProperties properties;

    public LedgerClient(RestClient ledgerRestClient, LedgerClientProperties properties) {
        this.restClient = ledgerRestClient;
        this.properties = properties;
    }

    public LedgerTransactionResult register(LedgerRegisterRequest request) {
        try {
            LedgerTransactionResult response = restClient.post()
                .uri(properties.transactionsPath())
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(LedgerTransactionResult.class);

            if (response == null) {
                throw new DownstreamClientException(
                    HttpStatus.BAD_GATEWAY,
                    "Ledger service returned an empty response"
                );
            }
            return response;
        } catch (RestClientResponseException exception) {
            HttpStatus status = HttpStatus.resolve(exception.getStatusCode().value());
            String message = extractMessage(exception);
            throw new DownstreamClientException(status == null ? HttpStatus.BAD_GATEWAY : status, message);
        }
    }

    private String extractMessage(RestClientResponseException exception) {
        try {
            Map<?, ?> payload = exception.getResponseBodyAs(Map.class);
            Object error = payload == null ? null : payload.get("error");
            if (error instanceof String errorMessage && !errorMessage.isBlank()) {
                return errorMessage;
            }
        } catch (Exception ignored) {
        }
        return "Ledger service error";
    }
}

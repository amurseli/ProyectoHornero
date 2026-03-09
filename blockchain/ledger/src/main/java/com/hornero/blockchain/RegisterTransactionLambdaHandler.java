package com.hornero.blockchain;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

public class RegisterTransactionLambdaHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Map<String, String> JSON_HEADERS = Map.of("Content-Type", "application/json");

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> event, Context context) {
        try {
            Request payload = parsePayload(event);

            String contractAddress = nonBlank(payload.contractAddress, EnvConfig.getRequired("CONTRACT_ADDRESS"));
            String emisor = required(payload.emisor, "emisor");
            String receptor = required(payload.receptor, "receptor");
            BigInteger amount = parseAmount(payload.amount);
            String reference = nonBlank(payload.reference, EnvConfig.getOrDefault("TX_REFERENCE", "sin-referencia"));

            String txHash = RegisterTransaction.register(contractAddress, emisor, receptor, amount, reference);

            return response(200, Map.of(
                "ok", true,
                "txHash", txHash,
                "contractAddress", contractAddress
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return response(400, Map.of(
                "ok", false,
                "error", e.getMessage()
            ));
        } catch (Exception e) {
            String errorMessage = "Error registering transaction: " + e.getMessage();
            if (context != null) {
                context.getLogger().log(errorMessage);
            } else {
                System.err.println(errorMessage);
            }

            boolean exposeDetails = "true".equalsIgnoreCase(
                EnvConfig.getOrDefault("LAMBDA_DEBUG_ERRORS", "false")
            );
            if (exposeDetails) {
                return response(500, Map.of(
                    "ok", false,
                    "error", "Internal error while registering transaction",
                    "cause", e.getMessage()
                ));
            }
            return response(500, Map.of(
                "ok", false,
                "error", "Internal error while registering transaction"
            ));
        }
    }

    private static Request parsePayload(Map<String, Object> event) {
        if (event == null) {
            throw new IllegalArgumentException("Missing Lambda event");
        }

        Object body = event.get("body");
        if (body == null) {
            return MAPPER.convertValue(event, Request.class);
        }

        if (body instanceof Map<?, ?> bodyMap) {
            return MAPPER.convertValue(bodyMap, Request.class);
        }

        if (!(body instanceof String rawBody) || rawBody.isBlank()) {
            throw new IllegalArgumentException("Missing request body");
        }

        String decodedBody = decodeIfNeeded(rawBody, event.get("isBase64Encoded"));
        try {
            return MAPPER.readValue(decodedBody, Request.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid JSON body: " + e.getOriginalMessage(), e);
        }
    }

    private static String decodeIfNeeded(String body, Object isBase64Encoded) {
        boolean shouldDecode = Boolean.TRUE.equals(isBase64Encoded)
            || "true".equalsIgnoreCase(String.valueOf(isBase64Encoded));

        if (!shouldDecode) {
            return body;
        }
        return new String(Base64.getDecoder().decode(body), StandardCharsets.UTF_8);
    }

    private static String required(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Missing required field: " + fieldName);
        }
        return value;
    }

    private static String nonBlank(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }

    private static BigInteger parseAmount(String amount) {
        if (amount == null || amount.isBlank()) {
            throw new IllegalArgumentException("Missing required field: amount");
        }
        try {
            return new BigInteger(amount);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Field amount must be an integer", e);
        }
    }

    private static Map<String, Object> response(int statusCode, Map<String, Object> payload) {
        try {
            return Map.of(
                "statusCode", statusCode,
                "headers", JSON_HEADERS,
                "body", MAPPER.writeValueAsString(payload)
            );
        } catch (JsonProcessingException e) {
            return Map.of(
                "statusCode", 500,
                "headers", JSON_HEADERS,
                "body", "{\"ok\":false,\"error\":\"Cannot serialize response\"}"
            );
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Request {
        public String contractAddress;
        public String emisor;
        public String receptor;
        public String amount;
        public String reference;
    }
}

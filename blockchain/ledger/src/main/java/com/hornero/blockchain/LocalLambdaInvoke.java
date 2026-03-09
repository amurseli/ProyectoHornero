package com.hornero.blockchain;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.file.Path;
import java.util.Map;

public class LocalLambdaInvoke {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        if (args.length < 1 || args[0].isBlank()) {
            throw new IllegalArgumentException("Usage: LocalLambdaInvoke <event-json-path>");
        }

        Path eventPath = Path.of(args[0]);
        Map<String, Object> event = MAPPER.readValue(
            eventPath.toFile(),
            new TypeReference<>() { }
        );

        RegisterTransactionLambdaHandler handler = new RegisterTransactionLambdaHandler();
        Map<String, Object> response = handler.handleRequest(event, null);

        String prettyResponse = MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(response);
        System.out.println(prettyResponse);
    }
}

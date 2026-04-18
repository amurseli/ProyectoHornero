package com.hornero.blockchain;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class EnvConfig {

    private static final Map<String, String> ENV_FILE_VALUES = loadDotEnv();

    private EnvConfig() {
    }

    public static String getRequired(String key) {
        String value = get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing required config: " + key);
        }
        return value;
    }

    public static String getOrDefault(String key, String defaultValue) {
        String value = get(key);
        return (value == null || value.isBlank()) ? defaultValue : value;
    }

    public static String get(String key) {
        String fromSystem = System.getenv(key);
        if (fromSystem != null && !fromSystem.isBlank()) {
            return fromSystem;
        }
        return ENV_FILE_VALUES.get(key);
    }

    private static Map<String, String> loadDotEnv() {
        for (Path candidate : List.of(Path.of(".env"), Path.of("ledger/.env"))) {
            if (!Files.exists(candidate)) {
                continue;
            }
            try {
                return parseDotEnv(candidate);
            } catch (IOException e) {
                throw new RuntimeException("Cannot read " + candidate + ": " + e.getMessage(), e);
            }
        }
        return Collections.emptyMap();
    }

    private static Map<String, String> parseDotEnv(Path path) throws IOException {
        Map<String, String> out = new HashMap<>();
        for (String rawLine : Files.readAllLines(path)) {
            String line = rawLine.trim();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }
            int separator = line.indexOf('=');
            if (separator <= 0) {
                continue;
            }

            String key = line.substring(0, separator).trim();
            String value = line.substring(separator + 1).trim();
            out.put(key, stripQuotes(value));
        }
        return out;
    }

    private static String stripQuotes(String value) {
        if (value.length() >= 2) {
            boolean doubleQuoted = value.startsWith("\"") && value.endsWith("\"");
            boolean singleQuoted = value.startsWith("'") && value.endsWith("'");
            if (doubleQuoted || singleQuoted) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }
}

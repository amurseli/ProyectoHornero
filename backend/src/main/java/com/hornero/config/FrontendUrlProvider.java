package com.hornero.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class FrontendUrlProvider {

    private final String frontendUrl;

    public FrontendUrlProvider(@Value("${app.frontend.url:http://localhost:5173}") String frontendUrl) {
        this.frontendUrl = frontendUrl;
    }

    public String getPrimaryFrontendUrl() {
        return getFrontendUrls().stream()
                .findFirst()
                .orElse("http://localhost:5173");
    }

    public List<String> getFrontendUrls() {
        return Arrays.stream(frontendUrl.split(","))
                .map(String::trim)
                .filter(url -> !url.isEmpty())
                .toList();
    }
}

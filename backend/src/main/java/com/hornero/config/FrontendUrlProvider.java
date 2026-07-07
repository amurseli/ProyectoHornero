package com.hornero.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class FrontendUrlProvider {

    private final String frontendUrl;

    public FrontendUrlProvider(@Value("${app.frontend.url:http://localhost:5173}") String frontendUrl) {
        this.frontendUrl = frontendUrl.trim();
    }

    public String getFrontendUrl() {
        return frontendUrl;
    }
}

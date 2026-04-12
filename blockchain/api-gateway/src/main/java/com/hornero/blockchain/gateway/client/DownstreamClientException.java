package com.hornero.blockchain.gateway.client;

import org.springframework.http.HttpStatus;

public class DownstreamClientException extends RuntimeException {

    private final HttpStatus status;

    public DownstreamClientException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}

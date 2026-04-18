package com.hornero.blockchain.api;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigInteger;

public record RegisterTransactionRequest(
    @NotBlank String emisor,
    @NotBlank String receptor,
    @NotNull @Positive BigInteger amount,
    @NotBlank @JsonAlias("referencia") String reference
) {
}

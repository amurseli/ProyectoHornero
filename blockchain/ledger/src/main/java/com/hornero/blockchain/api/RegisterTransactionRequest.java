package com.hornero.blockchain.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigInteger;

public record RegisterTransactionRequest(
    @NotBlank String emisor,
    @NotBlank String receptor,
    @NotNull @Positive BigInteger amount,
    @NotBlank String reference
) {
}

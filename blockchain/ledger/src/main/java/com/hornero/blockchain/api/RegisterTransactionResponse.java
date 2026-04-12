package com.hornero.blockchain.api;

public record RegisterTransactionResponse(
    boolean ok,
    String txHash,
    String contractAddress,
    String explorerUrl
) {
}

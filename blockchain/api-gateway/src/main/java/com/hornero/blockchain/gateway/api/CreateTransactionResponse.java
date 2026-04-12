package com.hornero.blockchain.gateway.api;

public record CreateTransactionResponse(
    boolean ok,
    String txHash,
    String explorerUrl,
    String contractAddress
) {
}

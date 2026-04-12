package com.hornero.blockchain.gateway.client;

public record LedgerTransactionResult(
    boolean ok,
    String txHash,
    String contractAddress,
    String explorerUrl
) {
}

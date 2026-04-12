package com.hornero.blockchain.service;

import com.hornero.blockchain.BlockchainClient;

public final class ExplorerUrlResolver {

    private ExplorerUrlResolver() {
    }

    public static String resolve(String txHash) {
        long chainId = BlockchainClient.chainId();
        if (chainId == 80002L) {
            return "https://amoy.polygonscan.com/tx/" + txHash;
        }
        return "https://polygonscan.com/tx/" + txHash;
    }
}

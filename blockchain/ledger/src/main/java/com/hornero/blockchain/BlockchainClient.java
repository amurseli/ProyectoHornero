package com.hornero.blockchain;

import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

public class BlockchainClient {

    public static Web3j connect() {
        String rpcUrl = EnvConfig.getRequired("POLYGON_RPC_URL");
        return Web3j.build(new HttpService(rpcUrl));
    }

    public static long chainId() {
        String configured = EnvConfig.get("POLYGON_CHAIN_ID");
        if (configured != null && !configured.isBlank()) {
            return Long.parseLong(configured);
        }

        String rpcUrl = EnvConfig.getRequired("POLYGON_RPC_URL").toLowerCase();
        if (rpcUrl.contains("amoy")) {
            return 80002L;
        }
        return 137L;
    }
}

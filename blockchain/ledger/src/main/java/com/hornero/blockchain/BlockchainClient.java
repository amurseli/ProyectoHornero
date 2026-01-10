package com.hornero.blockchain;

import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

public class BlockchainClient {

    public static Web3j connect() {
        String alchemyUrl = "https://polygon-mainnet.g.alchemy.com/v2/TU_API_KEY";
        return Web3j.build(new HttpService(alchemyUrl));
    }
}

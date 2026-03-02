package com.hornero.blockchain;

import org.web3j.protocol.Web3j;

import java.io.IOException;
import java.math.BigInteger;

public class TxConfig {

    private static final BigInteger WEI_PER_GWEI = BigInteger.valueOf(1_000_000_000L);
    private static final BigInteger DEFAULT_MIN_GWEI = BigInteger.valueOf(25);
    private static final BigInteger DEFAULT_GAS_LIMIT = BigInteger.valueOf(500_000L);

    private TxConfig() {
    }

    public static BigInteger gasPriceWei(Web3j web3j) throws IOException {
        String forcedGwei = EnvConfig.get("POLYGON_GAS_PRICE_GWEI");
        if (forcedGwei != null && !forcedGwei.isBlank()) {
            return new BigInteger(forcedGwei).multiply(WEI_PER_GWEI);
        }

        BigInteger nodePrice = web3j.ethGasPrice().send().getGasPrice();
        String minGweiFromEnv = EnvConfig.get("POLYGON_MIN_GAS_PRICE_GWEI");
        BigInteger minGwei = (minGweiFromEnv == null || minGweiFromEnv.isBlank())
            ? DEFAULT_MIN_GWEI
            : new BigInteger(minGweiFromEnv);
        BigInteger minWei = minGwei.multiply(WEI_PER_GWEI);
        return nodePrice.max(minWei);
    }

    public static BigInteger gasLimit() {
        String configured = EnvConfig.get("POLYGON_GAS_LIMIT");
        if (configured == null || configured.isBlank()) {
            return DEFAULT_GAS_LIMIT;
        }
        return new BigInteger(configured);
    }
}

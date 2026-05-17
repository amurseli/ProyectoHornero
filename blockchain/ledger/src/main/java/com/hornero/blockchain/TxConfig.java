package com.hornero.blockchain;

import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.request.Transaction;

import java.io.IOException;
import java.math.BigInteger;

public class TxConfig {

    private static final BigInteger WEI_PER_GWEI = BigInteger.valueOf(1_000_000_000L);
    private static final BigInteger DEFAULT_MIN_GWEI = BigInteger.valueOf(25);
    private static final BigInteger DEFAULT_GAS_LIMIT = BigInteger.valueOf(500_000L);
    private static final BigInteger HUNDRED = BigInteger.valueOf(100L);
    private static final BigInteger GAS_MARGIN_PERCENT = BigInteger.valueOf(120L);

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
        BigInteger selected = nodePrice.max(minWei);

        String maxGweiFromEnv = EnvConfig.get("POLYGON_MAX_GAS_PRICE_GWEI");
        if (maxGweiFromEnv != null && !maxGweiFromEnv.isBlank()) {
            BigInteger maxWei = new BigInteger(maxGweiFromEnv).multiply(WEI_PER_GWEI);
            selected = selected.min(maxWei);
        }
        return selected;
    }

    public static BigInteger gasLimit() {
        String configured = EnvConfig.get("POLYGON_GAS_LIMIT");
        if (configured == null || configured.isBlank()) {
            return DEFAULT_GAS_LIMIT;
        }
        return new BigInteger(configured);
    }

    public static BigInteger gasLimit(Web3j web3j, String from, String to, String data) throws IOException {
        String configured = EnvConfig.get("POLYGON_GAS_LIMIT");
        if (configured != null && !configured.isBlank()) {
            return new BigInteger(configured);
        }

        BigInteger estimated = estimateGas(web3j, from, to, data);
        if (estimated == null || estimated.signum() <= 0) {
            return DEFAULT_GAS_LIMIT;
        }

        BigInteger withMargin = estimated.multiply(GAS_MARGIN_PERCENT).divide(HUNDRED);
        return withMargin.min(DEFAULT_GAS_LIMIT);
    }

    private static BigInteger estimateGas(Web3j web3j, String from, String to, String data) throws IOException {
        Transaction tx = Transaction.createFunctionCallTransaction(from, null, null, null, to, data);
        return web3j.ethEstimateGas(tx).send().getAmountUsed();
    }
}

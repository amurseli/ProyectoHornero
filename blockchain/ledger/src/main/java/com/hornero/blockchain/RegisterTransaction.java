package com.hornero.blockchain;

import org.web3j.abi.EventEncoder;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Event;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.core.methods.response.Log;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.response.PollingTransactionReceiptProcessor;

import java.math.BigInteger;
import java.math.RoundingMode;
import java.math.BigDecimal;
import java.util.List;

public class RegisterTransaction {

    private static final Event TX_REGISTERED_EVENT = new Event(
        "TransactionRegistered",
        List.of(
            new TypeReference<Utf8String>() { },
            new TypeReference<Utf8String>() { },
            new TypeReference<Uint256>() { },
            new TypeReference<Utf8String>() { },
            new TypeReference<Uint256>() { }
        )
    );
    private static final BigDecimal WEI_PER_MATIC = new BigDecimal("1000000000000000000");
    private static final BigDecimal WEI_PER_GWEI = new BigDecimal("1000000000");

    public static String register(
        String contractAddress,
        String emisor,
        String receptor,
        BigInteger amount,
        String reference
    ) throws Exception {

        Web3j web3j = BlockchainClient.connect();
        try {
            Credentials credentials = Wallet.load();
            TransactionManager txManager =
                new RawTransactionManager(web3j, credentials, BlockchainClient.chainId());
            var gasPrice = TxConfig.gasPriceWei(web3j);

            Function registerTxFunction = new Function(
                "registerTransaction",
                List.of(
                    new Utf8String(emisor),
                    new Utf8String(receptor),
                    new Uint256(amount),
                    new Utf8String(reference)
                ),
                List.of()
            );

            String data = FunctionEncoder.encode(registerTxFunction);
            var gasLimit = TxConfig.gasLimit(web3j, credentials.getAddress(), contractAddress, data);
            var maxTxCostWei = gasPrice.multiply(gasLimit);
            var balanceWei = web3j.ethGetBalance(
                credentials.getAddress(),
                DefaultBlockParameterName.LATEST
            ).send().getBalance();

            System.out.printf(
                "Gas config -> gasPriceWei=%s (~%s gwei), gasLimit=%s, maxTxCostWei=%s (~%s MATIC)%n",
                gasPrice,
                weiToGwei(gasPrice),
                gasLimit,
                maxTxCostWei,
                weiToMatic(maxTxCostWei)
            );
            System.out.printf(
                "Wallet balance -> address=%s, balanceWei=%s (~%s MATIC)%n",
                credentials.getAddress(),
                balanceWei,
                weiToMatic(balanceWei)
            );

            if (balanceWei.compareTo(maxTxCostWei) < 0) {
                BigInteger missing = maxTxCostWei.subtract(balanceWei);
                throw new IllegalStateException(
                    "Insufficient funds for gas. " +
                        "requiredWei=" + maxTxCostWei + " (~" + weiToMatic(maxTxCostWei) + " MATIC), " +
                        "balanceWei=" + balanceWei + " (~" + weiToMatic(balanceWei) + " MATIC), " +
                        "missingWei=" + missing + " (~" + weiToMatic(missing) + " MATIC). " +
                        "Adjust POLYGON_GAS_PRICE_GWEI / POLYGON_MAX_GAS_PRICE_GWEI / POLYGON_GAS_LIMIT or fund wallet."
                );
            }

            EthSendTransaction tx = txManager.sendTransaction(
                gasPrice,
                gasLimit,
                contractAddress,
                data,
                BigInteger.ZERO
            );

            if (tx.hasError()) {
                throw new RuntimeException("Register error: " + tx.getError().getMessage());
            }

            String txHash = tx.getTransactionHash();
            System.out.println("Register TX hash: " + txHash);

            PollingTransactionReceiptProcessor receiptProcessor =
                new PollingTransactionReceiptProcessor(web3j, 1_000, 60);
            var receipt = receiptProcessor.waitForTransactionReceipt(txHash);
            System.out.println("Register status: " + receipt.getStatus());
            System.out.println("Block number: " + receipt.getBlockNumber());

            String topic0 = EventEncoder.encode(TX_REGISTERED_EVENT);
            boolean hasEvent = false;
            for (Log log : receipt.getLogs()) {
                if (!log.getTopics().isEmpty() && topic0.equals(log.getTopics().get(0))) {
                    hasEvent = true;
                    break;
                }
            }
            System.out.println("TransactionRegistered event found: " + hasEvent);
            return txHash;
        } finally {
            web3j.shutdown();
        }
    }

    private static String weiToMatic(BigInteger wei) {
        return new BigDecimal(wei).divide(WEI_PER_MATIC, 6, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
    }

    private static String weiToGwei(BigInteger wei) {
        return new BigDecimal(wei).divide(WEI_PER_GWEI, 3, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
    }
}

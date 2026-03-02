package com.hornero.blockchain;

import org.web3j.abi.EventEncoder;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Event;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.generated.Bytes32;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.core.methods.response.Log;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.response.PollingTransactionReceiptProcessor;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

public class RegisterTransaction {

    private static final Event TX_REGISTERED_EVENT = new Event(
        "TransactionRegistered",
        List.of(
            new TypeReference<Bytes32>(true) { },
            new TypeReference<Bytes32>(true) { },
            new TypeReference<Uint256>() { },
            new TypeReference<Utf8String>() { },
            new TypeReference<Uint256>() { }
        )
    );

    public static void main(String[] args) throws Exception {
        String contractAddress = args.length > 0 ? args[0] : EnvConfig.getRequired("CONTRACT_ADDRESS");
        String emisor = args.length > 1 ? args[1] : EnvConfig.getRequired("TX_EMISOR");
        String receptor = args.length > 2 ? args[2] : EnvConfig.getRequired("TX_RECEPTOR");
        BigInteger amount = new BigInteger(args.length > 3 ? args[3] : EnvConfig.getRequired("TX_AMOUNT"));
        String reference = args.length > 4 ? args[4] : EnvConfig.getOrDefault("TX_REFERENCE", "sin-referencia");

        register(contractAddress, emisor, receptor, amount, reference);
    }

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
            var gasLimit = TxConfig.gasLimit();

            Function registerTxFunction = new Function(
                "registerTransaction",
                List.of(
                    toBytes32(emisor),
                    toBytes32(receptor),
                    new Uint256(amount),
                    new Utf8String(reference)
                ),
                List.of()
            );

            String data = FunctionEncoder.encode(registerTxFunction);

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

    private static Bytes32 toBytes32(String value) {
        byte[] data;
        if (value.startsWith("0x")) {
            data = Numeric.hexStringToByteArray(value);
        } else {
            data = value.getBytes(StandardCharsets.UTF_8);
        }

        if (data.length > 32) {
            throw new IllegalArgumentException("Value exceeds 32 bytes: " + value);
        }
        return new Bytes32(Arrays.copyOf(data, 32));
    }
}

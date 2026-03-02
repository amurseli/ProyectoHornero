package com.hornero.blockchain;

import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.response.PollingTransactionReceiptProcessor;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.utils.Numeric;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class DeployContract {

    public static void main(String[] args) throws Exception {
        String contractAddress = deploy();
        System.out.println("Contract address: " + contractAddress);
    }

    public static String deploy() throws Exception {
        Web3j web3j = BlockchainClient.connect();
        try {
            Credentials credentials = Wallet.load();
            String bin = Files.readString(resolveBinPath());

            TransactionManager txManager =
                new RawTransactionManager(web3j, credentials, BlockchainClient.chainId());
            var gasPrice = TxConfig.gasPriceWei(web3j);
            var gasLimit = TxConfig.gasLimit();

            EthSendTransaction tx = txManager.sendTransaction(
                gasPrice,
                gasLimit,
                null,
                Numeric.prependHexPrefix(bin),
                null
            );

            if (tx.hasError()) {
                throw new RuntimeException("Deploy error: " + tx.getError().getMessage());
            }

            String txHash = tx.getTransactionHash();
            System.out.println("Deploy TX hash: " + txHash);

            PollingTransactionReceiptProcessor receiptProcessor =
                new PollingTransactionReceiptProcessor(web3j, 1_000, 60);
            var receipt = receiptProcessor.waitForTransactionReceipt(txHash);

            System.out.println("Deploy status: " + receipt.getStatus());
            return receipt.getContractAddress();
        } finally {
            web3j.shutdown();
        }
    }

    private static Path resolveBinPath() {
        for (Path path : new Path[] {
            Paths.get("src/main/resources/contracts/HorneroLedger.bin"),
            Paths.get("ledger/src/main/resources/contracts/HorneroLedger.bin")
        }) {
            if (Files.exists(path)) {
                return path;
            }
        }
        throw new IllegalStateException("HorneroLedger.bin not found. Compile Solidity contract first.");
    }
}

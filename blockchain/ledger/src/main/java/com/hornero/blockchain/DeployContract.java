package com.hornero.blockchain;

import org.web3j.protocol.Web3j;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.DefaultGasProvider;
import org.web3j.abi.FunctionEncoder;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.utils.Numeric;

import java.nio.file.Files;
import java.nio.file.Paths;

public class DeployContract {

    public static void main(String[] args) throws Exception {
        Web3j web3j = BlockchainClient.connect();
        Credentials credentials = Wallet.load();

        String bin = Files.readString(
            Paths.get("src/main/resources/contracts/HorneroLedger.bin")
        );

        TransactionManager txManager =
            new RawTransactionManager(web3j, credentials);

        EthSendTransaction tx = txManager.sendTransaction(
            DefaultGasProvider.GAS_PRICE,
            DefaultGasProvider.GAS_LIMIT,
            null,
            Numeric.prependHexPrefix(bin),
            null
        );

        System.out.println("TX hash: " + tx.getTransactionHash());
    }
}

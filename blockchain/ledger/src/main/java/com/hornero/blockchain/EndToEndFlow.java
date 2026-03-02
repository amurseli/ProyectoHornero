package com.hornero.blockchain;

import java.math.BigInteger;

public class EndToEndFlow {

    public static void main(String[] args) throws Exception {
        String emisor = args.length > 0 ? args[0] : EnvConfig.getRequired("TX_EMISOR");
        String receptor = args.length > 1 ? args[1] : EnvConfig.getRequired("TX_RECEPTOR");
        BigInteger amount = new BigInteger(args.length > 2 ? args[2] : EnvConfig.getRequired("TX_AMOUNT"));
        String reference = args.length > 3 ? args[3] : EnvConfig.getOrDefault("TX_REFERENCE", "sin-referencia");

        String contractAddress = DeployContract.deploy();
        System.out.println("Using deployed contract: " + contractAddress);

        RegisterTransaction.register(contractAddress, emisor, receptor, amount, reference);
    }
}

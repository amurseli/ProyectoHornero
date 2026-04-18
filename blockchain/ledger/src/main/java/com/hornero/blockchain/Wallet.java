package com.hornero.blockchain;

import org.web3j.crypto.Credentials;

public class Wallet {

    public static Credentials load() {
        return Credentials.create(EnvConfig.getRequired("PRIVATE_KEY"));
    }
}

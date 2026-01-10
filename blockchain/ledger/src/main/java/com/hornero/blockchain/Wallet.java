package com.hornero.blockchain;

import org.web3j.crypto.Credentials;

public class Wallet {

    public static Credentials load() {
        return Credentials.create("PRIVATE_KEY_ACA");
    }
}

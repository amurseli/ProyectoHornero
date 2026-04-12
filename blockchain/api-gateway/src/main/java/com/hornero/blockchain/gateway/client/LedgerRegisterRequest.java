package com.hornero.blockchain.gateway.client;

import java.math.BigInteger;

public record LedgerRegisterRequest(
    String emisor,
    String receptor,
    BigInteger amount,
    String reference
) {
}

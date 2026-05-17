package com.hornero.blockchain.service;

import com.hornero.blockchain.EnvConfig;
import com.hornero.blockchain.RegisterTransaction;
import com.hornero.blockchain.api.RegisterTransactionRequest;
import com.hornero.blockchain.api.RegisterTransactionResponse;
import org.springframework.stereotype.Service;

@Service
public class LedgerRegistrationService {

    public RegisterTransactionResponse register(RegisterTransactionRequest request) {
        String contractAddress = EnvConfig.getRequired("CONTRACT_ADDRESS");
        String txHash;
        try {
            txHash = RegisterTransaction.register(
                contractAddress,
                request.emisor(),
                request.receptor(),
                request.amount(),
                request.reference()
            );
        } catch (Exception exception) {
            throw new IllegalStateException("Could not register transaction on Polygon", exception);
        }

        return new RegisterTransactionResponse(
            true,
            txHash,
            contractAddress,
            ExplorerUrlResolver.resolve(txHash)
        );
    }
}

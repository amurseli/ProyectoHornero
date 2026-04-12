package com.hornero.blockchain.gateway.service;

import com.hornero.blockchain.gateway.api.CreateTransactionRequest;
import com.hornero.blockchain.gateway.api.CreateTransactionResponse;
import com.hornero.blockchain.gateway.client.LedgerClient;
import com.hornero.blockchain.gateway.client.LedgerRegisterRequest;
import com.hornero.blockchain.gateway.client.LedgerTransactionResult;
import org.springframework.stereotype.Service;

@Service
public class TransactionApplicationService {

    private final LedgerClient ledgerClient;

    public TransactionApplicationService(LedgerClient ledgerClient) {
        this.ledgerClient = ledgerClient;
    }

    public CreateTransactionResponse create(CreateTransactionRequest request) {
        LedgerTransactionResult result = ledgerClient.register(new LedgerRegisterRequest(
            request.emisor(),
            request.receptor(),
            request.amount(),
            request.reference()
        ));

        return new CreateTransactionResponse(
            result.ok(),
            result.txHash(),
            result.explorerUrl(),
            result.contractAddress()
        );
    }
}

package com.hornero.payments.service;

import com.hornero.payments.model.Transaction;
import com.hornero.payments.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

// Aisla el insert de Transaction en su propia transaccion (REQUIRES_NEW).
// En Postgres, una violacion de constraint deja la transaccion actual en
// estado ABORTED: si el insert corriera dentro de la transaccion de
// process()/handleWebhook(), cualquier lectura posterior (ej. buscar la
// transaccion existente para responder de forma idempotente) fallaria con
// "current transaction is aborted". Al ejecutarlo en una transaccion
// separada, solo esa se revierte y el llamador puede seguir operando.
@Service
public class TransactionPersistenceService {

    private final TransactionRepository transactionRepository;

    public TransactionPersistenceService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Transaction saveNew(Transaction transaction) {
        return transactionRepository.save(transaction);
    }
}

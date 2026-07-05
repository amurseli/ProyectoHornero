package com.hornero.payments.service;

import com.hornero.payments.model.Payout;
import com.hornero.payments.repository.PayoutRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

// Aisla el insert de Payout en su propia transaccion (REQUIRES_NEW), mismo motivo
// que TransactionPersistenceService: una violacion del constraint unico en
// payout.id_campaign no debe dejar en estado ABORTED la transaccion de
// executePayout(), para poder seguir y responder con el payout que ya existe.
@Service
public class PayoutPersistenceService {

    private final PayoutRepository payoutRepository;

    public PayoutPersistenceService(PayoutRepository payoutRepository) {
        this.payoutRepository = payoutRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Payout saveNew(Payout payout) {
        return payoutRepository.save(payout);
    }
}

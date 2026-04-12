package com.hornero.blockchain.api;

import com.hornero.blockchain.service.LedgerRegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/transactions")
public class LedgerController {

    private final LedgerRegistrationService ledgerRegistrationService;

    public LedgerController(LedgerRegistrationService ledgerRegistrationService) {
        this.ledgerRegistrationService = ledgerRegistrationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterTransactionResponse register(@Valid @RequestBody RegisterTransactionRequest request) {
        return ledgerRegistrationService.register(request);
    }
}

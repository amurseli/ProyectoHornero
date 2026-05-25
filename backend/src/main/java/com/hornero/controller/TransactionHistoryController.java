package com.hornero.controller;

import com.hornero.dto.TransactionHistoryResponse;
import com.hornero.repository.PaymentContributionRepository;
import com.hornero.repository.TransactionHistoryProjection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionHistoryController {

    @Autowired
    private PaymentContributionRepository paymentContributionRepository;

    @Value("${app.blockchain.explorer-base-url:https://polygonscan.com/tx/}")
    private String blockchainExplorerBaseUrl;

    @GetMapping("/history")
    public ResponseEntity<List<TransactionHistoryResponse>> getHistory() {
        List<TransactionHistoryResponse> history = paymentContributionRepository.findTransactionHistory()
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(history);
    }

    private TransactionHistoryResponse toResponse(TransactionHistoryProjection row) {
        TransactionHistoryResponse response = new TransactionHistoryResponse();
        response.setContributionId(row.getContributionId());
        response.setCampaignId(row.getCampaignId());
        response.setCampaignTitle(row.getCampaignTitle());
        response.setAmount(row.getAmount());
        response.setContributionStatus(row.getContributionStatus());
        response.setTransactionId(row.getTransactionId());
        response.setTransactionMethod(row.getTransactionMethod());
        response.setPaymentProvider(row.getPaymentProvider());
        response.setExternalTransactionId(row.getExternalTransactionId());
        response.setHashTx(row.getHashTx());
        response.setExplorerUrl(resolveExplorerUrl(row.getHashTx()));
        response.setCreatedAt(row.getCreatedAt());
        return response;
    }

    private String resolveExplorerUrl(String hashTx) {
        if (hashTx == null || hashTx.isBlank() || !hashTx.startsWith("0x")) {
            return null;
        }
        return blockchainExplorerBaseUrl + hashTx;
    }
}

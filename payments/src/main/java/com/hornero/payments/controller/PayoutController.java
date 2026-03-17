package com.hornero.payments.controller;

import com.hornero.payments.dto.PayoutStatusResponse;
import com.hornero.payments.dto.RefundSummaryResponse;
import com.hornero.payments.service.PayoutService;
import com.hornero.payments.service.RefundService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/campaigns")
public class PayoutController {

    private static final Logger logger = LoggerFactory.getLogger(PayoutController.class);

    private final PayoutService payoutService;
    private final RefundService refundService;

    @Value("${app.service-key}")
    private String serviceKey;

    public PayoutController(PayoutService payoutService, RefundService refundService) {
        this.payoutService = payoutService;
        this.refundService = refundService;
    }

    // POST /api/payments/campaigns/{id}/payout
    // Ejecuta el payout al creador. Solo accesible con X-Service-Key (llamado por admin o job del backend).
    @PostMapping("/{id}/payout")
    public ResponseEntity<PayoutStatusResponse> executePayout(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body,
            @RequestHeader("X-Service-Key") String incomingKey) {

        validateServiceKey(incomingKey);

        Long creatorUserId = body.get("creatorUserId");
        if (creatorUserId == null) {
            throw new IllegalArgumentException("Se requiere creatorUserId en el body");
        }

        PayoutStatusResponse response = payoutService.executePayout(id, creatorUserId);
        return ResponseEntity.ok(response);
    }

    // GET /api/payments/campaigns/{id}/payout
    // Consulta el estado del payout de una campaña. Accesible con X-Service-Key.
    @GetMapping("/{id}/payout")
    public ResponseEntity<PayoutStatusResponse> getPayoutStatus(
            @PathVariable Long id,
            @RequestHeader("X-Service-Key") String incomingKey) {

        validateServiceKey(incomingKey);

        PayoutStatusResponse response = payoutService.getPayoutStatus(id);
        return ResponseEntity.ok(response);
    }

    // POST /api/payments/campaigns/{id}/refund-all
    // Reembolsa todas las contributions APPROVED. Llamado por el backend cuando una campaña falla/cancela.
    @PostMapping("/{id}/refund-all")
    public ResponseEntity<RefundSummaryResponse> refundAll(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-Service-Key") String incomingKey) {

        validateServiceKey(incomingKey);

        String reason = body.get("reason");
        if (reason == null || (!reason.equals("CAMPAIGN_FAILED") && !reason.equals("CAMPAIGN_CANCELLED"))) {
            throw new IllegalArgumentException("reason debe ser CAMPAIGN_FAILED o CAMPAIGN_CANCELLED");
        }

        RefundSummaryResponse response = refundService.refundAll(id, reason);
        return ResponseEntity.ok(response);
    }

    // GET /api/payments/campaigns/{id}/refunds
    // Lista los refunds de una campaña. Accesible con X-Service-Key.
    @GetMapping("/{id}/refunds")
    public ResponseEntity<RefundSummaryResponse> getRefunds(
            @PathVariable Long id,
            @RequestHeader("X-Service-Key") String incomingKey) {

        validateServiceKey(incomingKey);

        RefundSummaryResponse response = refundService.getRefunds(id);
        return ResponseEntity.ok(response);
    }

    private void validateServiceKey(String incomingKey) {
        if (!serviceKey.equals(incomingKey)) {
            throw new SecurityException("X-Service-Key inválida");
        }
    }
}

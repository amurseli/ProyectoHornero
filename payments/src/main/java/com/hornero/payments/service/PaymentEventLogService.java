package com.hornero.payments.service;

import com.hornero.payments.model.PaymentEventLog;
import com.hornero.payments.repository.PaymentEventLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class PaymentEventLogService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentEventLogService.class);

    private final PaymentEventLogRepository repo;

    public PaymentEventLogService(PaymentEventLogRepository repo) {
        this.repo = repo;
    }

    public void logContributionInitiated(Long contributionId, Long userId, Long campaignId, BigDecimal amount) {
        save("CONTRIBUTION", contributionId, "CONTRIBUTION_INITIATED", null, "PENDING",
                String.format("Contribución iniciada por usuario %d para campaña %d. Monto: %s", userId, campaignId, amount));
    }

    public void logPaymentProcessed(Long contributionId, String previousStatus, String newStatus, String mpExternalId) {
        save("CONTRIBUTION", contributionId, "PAYMENT_PROCESSED", previousStatus, newStatus,
                String.format("Pago procesado por MercadoPago. External ID: %s", mpExternalId));
    }

    public void logWebhookUpdate(Long contributionId, String previousStatus, String newStatus, String mpPaymentId) {
        save("CONTRIBUTION", contributionId, "WEBHOOK_STATUS_UPDATE", previousStatus, newStatus,
                String.format("Estado actualizado via webhook. MP Payment ID: %s", mpPaymentId));
    }

    public void logRefundInitiated(Long refundId, Long contributionId, String reason) {
        save("REFUND", refundId, "REFUND_INITIATED", null, "PENDING",
                String.format("Refund iniciado para contribución %d. Razón: %s", contributionId, reason));
    }

    public void logRefundCompleted(Long refundId, String mpRefundExternalId) {
        save("REFUND", refundId, "REFUND_COMPLETED", "PENDING", "COMPLETED",
                String.format("Refund completado. External ID: %s", mpRefundExternalId));
    }

    public void logRefundFailed(Long refundId, String errorMessage) {
        save("REFUND", refundId, "REFUND_FAILED", "PENDING", "FAILED",
                String.format("Refund fallido: %s", errorMessage));
    }

    public void logPayoutRegistered(Long payoutId, Long campaignId, BigDecimal netAmount) {
        save("PAYOUT", payoutId, "PAYOUT_REGISTERED", null, "PENDING_MANUAL_TRANSFER",
                String.format("Payout registrado para campaña %d. Monto neto: %s", campaignId, netAmount));
    }

    public void logPayoutConfirmed(Long payoutId, String mpTransferReference) {
        save("PAYOUT", payoutId, "PAYOUT_CONFIRMED", "PENDING_MANUAL_TRANSFER", "COMPLETED",
                String.format("Payout confirmado manualmente. Referencia MP: %s", mpTransferReference));
    }

    private void save(String entityType, Long entityId, String eventType,
                      String previousStatus, String newStatus, String message) {
        try {
            PaymentEventLog log = new PaymentEventLog();
            log.setEntityType(entityType);
            log.setEntityId(entityId);
            log.setEventType(eventType);
            log.setPreviousStatus(previousStatus);
            log.setNewStatus(newStatus);
            log.setMessage(message);
            repo.save(log);
        } catch (Exception e) {
            logger.error("Error al persistir payment_event_log [{} {} {}]: {}", entityType, entityId, eventType, e.getMessage());
        }
    }
}

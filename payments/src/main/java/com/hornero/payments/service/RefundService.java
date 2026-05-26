package com.hornero.payments.service;

import com.hornero.payments.client.BackendClient;
import com.hornero.payments.client.LedgerClient;
import com.hornero.payments.dto.RefundSummaryResponse;
import com.hornero.payments.gateway.MercadoPagoGateway;
import com.hornero.payments.model.Contribution;
import com.hornero.payments.model.Refund;
import com.hornero.payments.repository.ContributionRepository;
import com.hornero.payments.repository.RefundRepository;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.PaymentRefund;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class RefundService {

    private static final Logger logger = LoggerFactory.getLogger(RefundService.class);

    private final RefundRepository refundRepository;
    private final ContributionRepository contributionRepository;
    private final MercadoPagoGateway mercadoPagoGateway;
    private final BackendClient backendClient;
    private final LedgerClient ledgerClient;
    private final PaymentEventLogService eventLog;

    public RefundService(RefundRepository refundRepository,
                         ContributionRepository contributionRepository,
                         MercadoPagoGateway mercadoPagoGateway,
                         BackendClient backendClient,
                         LedgerClient ledgerClient,
                         PaymentEventLogService eventLog) {
        this.refundRepository = refundRepository;
        this.contributionRepository = contributionRepository;
        this.mercadoPagoGateway = mercadoPagoGateway;
        this.backendClient = backendClient;
        this.ledgerClient = ledgerClient;
        this.eventLog = eventLog;
    }

    // Reembolsa todas las contributions APPROVED de una campaña.
    // Idempotente: si ya existe un refund COMPLETED para una contribution, la saltea.
    // Si existe un refund FAILED, reutiliza ese registro en lugar de crear uno nuevo.
    @Transactional
    public RefundSummaryResponse refundAll(Long campaignId, String reason) {
        List<Contribution> approved = contributionRepository.findByIdCampaignAndStatus(campaignId, "APPROVED");
        String campaignTitle = approved.isEmpty() ? backendClient.getCampaignTitle(campaignId) : backendClient.getCampaignTitle(approved.get(0).getIdCampaign());

        if (approved.isEmpty()) {
            logger.info("Campaña {} no tiene contributions APPROVED para reembolsar", campaignId);
            notifyMoneyStatus(campaignId);
            return new RefundSummaryResponse(campaignId, reason, List.of());
        }

        List<RefundSummaryResponse.RefundInfo> results = new ArrayList<>();

        for (Contribution contribution : approved) {
            String username = backendClient.getUsername(contribution.getIdUser());
            Optional<Refund> existing = refundRepository.findFirstByContribution_Id(contribution.getId());

            if (existing.isPresent() && "COMPLETED".equals(existing.get().getStatus())) {
                logger.info("Contribution {} ya tiene refund COMPLETED, saltando", contribution.getId());
                results.add(toInfo(existing.get(), contribution.getId()));
                continue;
            }

            Refund refund = existing.orElseGet(() -> {
                Refund r = new Refund();
                r.setContribution(contribution);
                r.setAmount(contribution.getAmount());
                r.setReason(reason);
                String provider = contribution.getTransaction() != null
                        ? contribution.getTransaction().getPaymentProvider()
                        : "MERCADO_PAGO";
                r.setPaymentProvider(provider);
                return r;
            });

            processRefund(refund, contribution, campaignTitle, username);
            results.add(toInfo(refund, contribution.getId()));
        }

        logger.info("Refund masivo campaña {}: {} procesados ({} completados, {} fallidos)",
                campaignId, results.size(),
                results.stream().filter(r -> "COMPLETED".equals(r.getStatus())).count(),
                results.stream().filter(r -> "FAILED".equals(r.getStatus())).count());

        notifyMoneyStatus(campaignId);
        return new RefundSummaryResponse(campaignId, reason, results);
    }

    // Reintenta únicamente los refunds que quedaron en FAILED para una campaña.
    @Transactional
    public RefundSummaryResponse retryFailedRefunds(Long campaignId) {
        List<Refund> failedRefunds = refundRepository.findByContribution_IdCampaignAndStatus(campaignId, "FAILED");
        String campaignTitle = backendClient.getCampaignTitle(campaignId);

        if (failedRefunds.isEmpty()) {
            logger.info("Campaña {} no tiene refunds FAILED para reintentar", campaignId);
            return new RefundSummaryResponse(campaignId, null, List.of());
        }

        List<RefundSummaryResponse.RefundInfo> results = new ArrayList<>();

        for (Refund refund : failedRefunds) {
            Contribution contribution = refund.getContribution();
            String username = backendClient.getUsername(contribution.getIdUser());
            processRefund(refund, contribution, campaignTitle, username);
            results.add(toInfo(refund, contribution.getId()));
        }

        logger.info("Retry refunds campaña {}: {} procesados ({} completados, {} fallidos)",
                campaignId, results.size(),
                results.stream().filter(r -> "COMPLETED".equals(r.getStatus())).count(),
                results.stream().filter(r -> "FAILED".equals(r.getStatus())).count());

        notifyMoneyStatus(campaignId);
        return new RefundSummaryResponse(campaignId, null, results);
    }

    public RefundSummaryResponse getRefunds(Long campaignId) {
        List<Refund> refunds = refundRepository.findByContribution_IdCampaign(campaignId);
        String reason = refunds.isEmpty() ? null : refunds.get(0).getReason();
        List<RefundSummaryResponse.RefundInfo> infos = refunds.stream()
                .map(r -> toInfo(r, r.getContribution().getId()))
                .toList();
        return new RefundSummaryResponse(campaignId, reason, infos);
    }

    private void processRefund(Refund refund, Contribution contribution, String campaignTitle, String username) {
        String transactionId = contribution.getTransaction() != null
                ? contribution.getTransaction().getIdTransactionExternal()
                : null;

        if (transactionId == null) {
            refund.setStatus("FAILED");
            refundRepository.save(refund);
            logger.warn("Contribution {} sin transacción registrada, refund marcado como FAILED", contribution.getId());
            eventLog.logRefundFailed(refund.getId(), "Sin transacción registrada para contribution " + contribution.getId());
            return;
        }

        // Persistir antes de llamar a MP para garantizar que refund.getId() no sea null en los event logs
        refundRepository.save(refund);
        eventLog.logRefundInitiated(refund.getId(), contribution.getId(), refund.getReason());

        try {
            PaymentRefund providerRefund = mercadoPagoGateway.refund(Long.valueOf(transactionId));
            refund.setIdRefundExternal(String.valueOf(providerRefund.getId()));
            refund.setStatus("COMPLETED");
            refund.setProcessedAt(LocalDateTime.now());
            refund.setHashTx(ledgerClient.registerRefundTransaction(username, refund, campaignTitle));
            refundRepository.save(refund);
            contribution.setStatus("CANCELLED");
            contributionRepository.save(contribution);
            logger.info("Refund completado para contribution {}: refundId={}", contribution.getId(), providerRefund.getId());
            eventLog.logRefundCompleted(refund.getId(), String.valueOf(providerRefund.getId()));
        } catch (MPApiException e) {
            if (e.getStatusCode() == 404) {
                // Pago no encontrado en MP (ej: pago de prueba en entorno productivo). No hay dinero que devolver.
                refund.setStatus("COMPLETED");
                refund.setProcessedAt(LocalDateTime.now());
                refundRepository.save(refund);
                contribution.setStatus("CANCELLED");
                contributionRepository.save(contribution);
                logger.warn("Contribution {} no encontrada en MP (404) - el pago ya fue reembolsado o no tiene fondos retenidos. Marcando como completado.", contribution.getId());
                eventLog.logRefundCompleted(refund.getId(), "ALREADY_REFUNDED_OR_NO_FUNDS");
            } else {
                refund.setStatus("FAILED");
                refundRepository.save(refund);
                logger.error("Error de API MP al reembolsar contribution {}: {} - {}",
                        contribution.getId(), e.getStatusCode(), e.getApiResponse().getContent());
                eventLog.logRefundFailed(refund.getId(), "MP API error " + e.getStatusCode() + ": " + e.getMessage());
            }
        } catch (MPException e) {
            refund.setStatus("FAILED");
            refundRepository.save(refund);
            logger.error("Error de SDK MP al reembolsar contribution {}: {}", contribution.getId(), e.getMessage());
            eventLog.logRefundFailed(refund.getId(), "MP SDK error: " + e.getMessage());
        }
    }

    private void notifyMoneyStatus(Long campaignId) {
        List<Refund> failedRefunds = refundRepository.findByContribution_IdCampaignAndStatus(campaignId, "FAILED");
        String moneyStatus = failedRefunds.isEmpty() ? "REFUND_COMPLETED" : "REFUND_PARTIAL";
        try {
            backendClient.updateCampaignMoneyStatus(campaignId, moneyStatus);
        } catch (Exception e) {
            logger.error("Error al notificar money_status al backend para campaña {}: {}", campaignId, e.getMessage());
        }
    }

    private RefundSummaryResponse.RefundInfo toInfo(Refund r, Long contributionId) {
        return new RefundSummaryResponse.RefundInfo(
                r.getId(), contributionId, r.getAmount(),
                r.getStatus(), r.getIdRefundExternal(), r.getProcessedAt());
    }
}

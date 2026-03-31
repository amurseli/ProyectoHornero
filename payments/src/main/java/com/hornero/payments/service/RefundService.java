package com.hornero.payments.service;

import com.hornero.payments.dto.RefundSummaryResponse;
import com.hornero.payments.model.Contribution;
import com.hornero.payments.model.Refund;
import com.hornero.payments.repository.ContributionRepository;
import com.hornero.payments.repository.RefundRepository;
import com.mercadopago.client.payment.PaymentRefundClient;
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

@Service
public class RefundService {

    private static final Logger logger = LoggerFactory.getLogger(RefundService.class);

    private final RefundRepository refundRepository;
    private final ContributionRepository contributionRepository;

    public RefundService(RefundRepository refundRepository,
                         ContributionRepository contributionRepository) {
        this.refundRepository = refundRepository;
        this.contributionRepository = contributionRepository;
    }

    // Reembolsa todas las contributions APPROVED de una campaña.
    // Llamado por el backend cuando una campaña pasa a FAILED o CANCELLED.
    @Transactional
    public RefundSummaryResponse refundAll(Long campaignId, String reason) {
        List<Contribution> approved = contributionRepository.findByIdCampaignAndStatus(campaignId, "APPROVED");

        if (approved.isEmpty()) {
            logger.info("Campaña {} no tiene contributions APPROVED para reembolsar", campaignId);
            return new RefundSummaryResponse(campaignId, reason, List.of());
        }

        List<RefundSummaryResponse.RefundInfo> results = new ArrayList<>();

        for (Contribution contribution : approved) {
            Refund refund = new Refund();
            refund.setContribution(contribution);
            refund.setAmount(contribution.getAmount());
            refund.setReason(reason);

            String transactionId = contribution.getTransaction() != null
                    ? contribution.getTransaction().getIdTransactionExternal()
                    : null;
            String provider = contribution.getTransaction() != null
                    ? contribution.getTransaction().getPaymentProvider()
                    : "MERCADO_PAGO";

            refund.setPaymentProvider(provider);

            if (transactionId == null) {
                // No hay transacción registrada: marcar como FAILED para gestión manual
                refund.setStatus("FAILED");
                refundRepository.save(refund);
                logger.warn("Contribution {} sin transacción registrada, refund marcado como FAILED para gestión manual", contribution.getId());
            } else {
                try {
                    PaymentRefundClient refundClient = new PaymentRefundClient();
                    PaymentRefund providerRefund = refundClient.refund(Long.valueOf(transactionId));

                    refund.setIdRefundExternal(String.valueOf(providerRefund.getId()));
                    refund.setStatus("COMPLETED");
                    refund.setProcessedAt(LocalDateTime.now());
                    refundRepository.save(refund);

                    contribution.setStatus("CANCELLED");
                    contributionRepository.save(contribution);

                    logger.info("Refund completado para contribution {}: refundId={}",
                            contribution.getId(), providerRefund.getId());

                } catch (MPApiException e) {
                    refund.setStatus("FAILED");
                    refundRepository.save(refund);
                    logger.error("Error de API MP al reembolsar contribution {}: {} - {}",
                            contribution.getId(), e.getStatusCode(), e.getApiResponse().getContent());

                } catch (MPException e) {
                    refund.setStatus("FAILED");
                    refundRepository.save(refund);
                    logger.error("Error de SDK MP al reembolsar contribution {}: {}",
                            contribution.getId(), e.getMessage());
                }
            }

            results.add(new RefundSummaryResponse.RefundInfo(
                    refund.getId(),
                    contribution.getId(),
                    refund.getAmount(),
                    refund.getStatus(),
                    refund.getIdRefundExternal(),
                    refund.getProcessedAt()
            ));
        }

        logger.info("Refund masivo campaña {}: {} procesados ({} completados, {} fallidos)",
                campaignId, results.size(),
                results.stream().filter(r -> "COMPLETED".equals(r.getStatus())).count(),
                results.stream().filter(r -> "FAILED".equals(r.getStatus())).count());

        return new RefundSummaryResponse(campaignId, reason, results);
    }

    public RefundSummaryResponse getRefunds(Long campaignId) {
        List<Refund> refunds = refundRepository.findByContribution_IdCampaign(campaignId);

        String reason = refunds.isEmpty() ? null : refunds.get(0).getReason();

        List<RefundSummaryResponse.RefundInfo> infos = refunds.stream()
                .map(r -> new RefundSummaryResponse.RefundInfo(
                        r.getId(),
                        r.getContribution().getId(),
                        r.getAmount(),
                        r.getStatus(),
                        r.getIdRefundExternal(),
                        r.getProcessedAt()
                ))
                .toList();

        return new RefundSummaryResponse(campaignId, reason, infos);
    }
}

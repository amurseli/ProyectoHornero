package com.hornero.controller;

import com.hornero.client.PaymentsServiceClient;
import com.hornero.model.Campaign;
import com.hornero.service.CampaignService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// Endpoints de uso interno exclusivo (scheduler container).
// Protegidos por X-Service-Key, sin JWT.
@RestController
@RequestMapping("/internal")
public class InternalController {

    private static final Logger logger = LoggerFactory.getLogger(InternalController.class);

    @Autowired
    private CampaignService campaignService;

    @Autowired
    private PaymentsServiceClient paymentsServiceClient;

    @Value("${app.service-key}")
    private String serviceKey;

    // POST /internal/finalize-campaigns
    // Detecta campañas terminadas y dispara payout o refund según corresponda.
    // También reintenta payouts/refunds que fallaron en ejecuciones previas.
    @PostMapping("/finalize-campaigns")
    public ResponseEntity<Map<String, Object>> finalizeCampaigns(
            @RequestHeader("X-Service-Key") String incomingKey) {

        if (!serviceKey.equals(incomingKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        int finalized = 0;
        int payoutRetried = 0;
        int refundRetried = 0;
        int errors = 0;

        // 1. Finalizar campañas CROWDFUNDING que cumplieron la fecha de fin
        List<Campaign> expired = campaignService.findExpiredCrowdfundingCampaigns();
        logger.info("Campañas vencidas encontradas: {}", expired.size());

        for (Campaign campaign : expired) {
            try {
                boolean wasFinalized = campaignService.finalizeCampaign(campaign);
                if (!wasFinalized) continue;

                finalized++;
                logger.info("Campaña {} finalizada con status={}", campaign.getId(), campaign.getStatus());

                if ("SUCCESSFUL".equals(campaign.getStatus())) {
                    Long creatorId = campaign.getOwner() != null ? campaign.getOwner().getId() : null;
                    if (creatorId == null) {
                        errors++;
                        logger.error("Campaña {} no tiene owner, no se puede disparar payout", campaign.getId());
                        continue;
                    }
                    paymentsServiceClient.triggerPayout(campaign.getId(), creatorId);
                } else {
                    paymentsServiceClient.triggerRefundAll(campaign.getId());
                }
            } catch (Exception e) {
                errors++;
                logger.error("Error al finalizar campaña {}: {}", campaign.getId(), e.getMessage());
            }
        }

        // 2. Reintentar payouts fallidos (SUCCESSFUL + PAYOUT_PENDING)
        List<Campaign> pendingPayouts = campaignService.findSuccessfulWithPendingPayout();
        logger.info("Payouts pendientes de reintento: {}", pendingPayouts.size());

        for (Campaign campaign : pendingPayouts) {
            try {
                Long creatorId = campaign.getOwner() != null ? campaign.getOwner().getId() : null;
                if (creatorId == null) {
                    errors++;
                    logger.error("Campaña {} no tiene owner, no se puede reintentar payout", campaign.getId());
                    continue;
                }
                paymentsServiceClient.triggerPayout(campaign.getId(), creatorId);
                payoutRetried++;
                logger.info("Payout reintentado para campaña {}", campaign.getId());
            } catch (Exception e) {
                errors++;
                logger.error("Error al reintentar payout para campaña {}: {}", campaign.getId(), e.getMessage());
            }
        }

        // 3. Reintentar refunds parciales (FAILED + REFUND_PARTIAL)
        List<Campaign> partialRefunds = campaignService.findFailedWithPartialRefund();
        logger.info("Refunds parciales pendientes de reintento: {}", partialRefunds.size());

        for (Campaign campaign : partialRefunds) {
            try {
                paymentsServiceClient.triggerRetryFailedRefunds(campaign.getId());
                refundRetried++;
                logger.info("Retry de refunds reintentado para campaña {}", campaign.getId());
            } catch (Exception e) {
                errors++;
                logger.error("Error al reintentar refunds para campaña {}: {}", campaign.getId(), e.getMessage());
            }
        }

        return ResponseEntity.ok(Map.of(
                "finalized", finalized,
                "payoutRetried", payoutRetried,
                "refundRetried", refundRetried,
                "errors", errors
        ));
    }
}

package com.hornero.payments.service;

import com.hornero.payments.client.BackendClient;
import com.hornero.payments.client.LedgerClient;
import com.hornero.payments.dto.PayoutStatusResponse;
import com.hornero.payments.event.NotificationEventPublisher;
import com.hornero.payments.event.PayoutCompletedEvent;
import com.hornero.payments.model.Contribution;
import com.hornero.payments.model.Payout;
import com.hornero.payments.repository.ContributionRepository;
import com.hornero.payments.repository.PayoutRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PayoutService {

    private static final Logger logger = LoggerFactory.getLogger(PayoutService.class);

    private final PayoutRepository payoutRepository;
    private final ContributionRepository contributionRepository;
    private final BackendClient backendClient; 
    private final LedgerClient ledgerClient;
    private final PaymentEventLogService eventLog;
    private final NotificationEventPublisher notificationPublisher;
    private final PayoutPersistenceService payoutPersistenceService;

    @Value("${app.fees.platform-rate}")
    private BigDecimal platformRate;

    @Value("${app.fees.provider-rate}")
    private BigDecimal providerRate;

    public PayoutService(PayoutRepository payoutRepository,
                         ContributionRepository contributionRepository,
                         BackendClient backendClient,
                         LedgerClient ledgerClient,
                         PaymentEventLogService eventLog,
                         NotificationEventPublisher notificationPublisher,
                         PayoutPersistenceService payoutPersistenceService) {
        this.payoutRepository = payoutRepository;
        this.contributionRepository = contributionRepository;
        this.backendClient = backendClient;
        this.ledgerClient = ledgerClient;
        this.eventLog = eventLog;
        this.notificationPublisher = notificationPublisher;
        this.payoutPersistenceService = payoutPersistenceService;
    }

    // Ejecuta el payout al creador para una campaña SUCCESSFUL.
    // Idempotente: si ya existe un payout para la campaña, retorna el existente sin crear uno nuevo.
    @Transactional
    public PayoutStatusResponse executePayout(Long campaignId, Long creatorUserId) {
        if (payoutRepository.existsByIdCampaign(campaignId)) {
            logger.info("Payout para campaña {} ya existe, retornando estado actual", campaignId);
            return buildResponse(payoutRepository.findByIdCampaign(campaignId).get());
        }

        // Verificar que la campaña está en SUCCESSFUL consultando al backend
        backendClient.validateCampaignSuccessful(campaignId);

        // Obtener CBU del creador
        String creatorCbu = backendClient.getCreatorPayoutCbu(creatorUserId);

        // Calcular montos
        BigDecimal grossAmount = contributionRepository
                .findByIdCampaignAndStatus(campaignId, "APPROVED")
                .stream()
                .map(Contribution::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (grossAmount.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalStateException("La campaña no tiene contribuciones aprobadas para transferir");
        }

        BigDecimal platformFee = grossAmount.multiply(platformRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal providerFee = grossAmount.multiply(providerRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netAmount = grossAmount.subtract(platformFee).subtract(providerFee);

        // Crear el registro de payout
        Payout payout = new Payout();
        payout.setIdCampaign(campaignId);
        payout.setIdCreatorUser(creatorUserId);
        payout.setGrossAmount(grossAmount);
        payout.setPlatformFee(platformFee);
        payout.setProviderFee(providerFee);
        payout.setNetAmount(netAmount);
        payout.setPaymentProvider("MERCADO_PAGO");
        payout.setStatus("PENDING_MANUAL_TRANSFER");

        try {
            payoutPersistenceService.saveNew(payout);
        } catch (DataIntegrityViolationException dup) {
            // Otra llamada concurrente (ej: reintento del cron de finalize-campaigns mientras
            // la corrida anterior todavia procesaba esta campaña) ya registro el payout primero.
            // Devolvemos ese, en vez de crear un segundo payout y transferir el dinero dos veces.
            logger.warn("Payout duplicado detectado para campaña {}, probablemente por una llamada concurrente: {}",
                    campaignId, dup.getMessage());
            return buildResponse(payoutRepository.findByIdCampaign(campaignId).orElseThrow(() -> dup));
        }

        logger.info("Payout registrado para campaña {} — transferencia manual pendiente: gross={} net={} CBU={}",
                campaignId, grossAmount, netAmount, creatorCbu);
        eventLog.logPayoutRegistered(payout.getId(), campaignId, netAmount);

        return buildResponse(payout);
    }

    @Transactional
    public PayoutStatusResponse confirmManualPayout(Long campaignId, String mpTransferReference) {
        Payout payout = payoutRepository.findByIdCampaign(campaignId)
                .orElseThrow(() -> new IllegalArgumentException("No existe payout para la campaña " + campaignId));
        String campaignTitle = backendClient.getCampaignTitle(campaignId);
        String creatorUsername = backendClient.getUsername(payout.getIdCreatorUser());

        payout.setStatus("COMPLETED");
        payout.setProcessedAt(LocalDateTime.now());
        if (mpTransferReference != null && !mpTransferReference.isBlank()) {
            payout.setIdPayoutExternal(mpTransferReference);
        }
        payout.setHashTx(ledgerClient.registerPayoutTransaction(creatorUsername, payout, campaignTitle));
        payoutRepository.save(payout);

        try {
            backendClient.updateCampaignMoneyStatus(campaignId, "PAYOUT_COMPLETED");
        } catch (Exception e) {
            logger.error("Error al notificar PAYOUT_COMPLETED al backend para campaña {}: {}", campaignId, e.getMessage());
        }

        publishPayoutCompletedEvent(payout, campaignTitle);

        logger.info("Payout de campaña {} confirmado manualmente. Referencia MP: {}", campaignId, mpTransferReference);
        eventLog.logPayoutConfirmed(payout.getId(), mpTransferReference);
        return buildResponse(payout);
    }

    // Publica el evento PAYOUT_COMPLETED hacia notificaciones. Un fallo aca no debe
    // interrumpir la confirmacion del payout, que ya quedo persistida.
    private void publishPayoutCompletedEvent(Payout payout, String campaignTitle) {
        try {
            BackendClient.UserContactInfo creatorContact = backendClient.getUserContactInfo(payout.getIdCreatorUser());

            notificationPublisher.publishPayoutCompleted(new PayoutCompletedEvent(
                    payout.getId(),
                    payout.getIdCreatorUser(),
                    creatorContact.getEmail(),
                    creatorContact.getFirstName(),
                    payout.getIdCampaign(),
                    campaignTitle,
                    payout.getNetAmount()
            ));
        } catch (Exception e) {
            logger.error("Error al publicar evento de payout completado {}: {}", payout.getId(), e.getMessage());
        }
    }

    public PayoutStatusResponse getPayoutStatus(Long campaignId) {
        Payout payout = payoutRepository.findByIdCampaign(campaignId)
                .orElseThrow(() -> new IllegalArgumentException("No existe payout para la campaña " + campaignId));
        return buildResponse(payout);
    }

    private PayoutStatusResponse buildResponse(Payout payout) {
        return new PayoutStatusResponse(
                payout.getId(),
                payout.getIdCampaign(),
                payout.getGrossAmount(),
                payout.getPlatformFee(),
                payout.getProviderFee(),
                payout.getNetAmount(),
                payout.getPaymentProvider(),
                payout.getStatus(),
                payout.getIdPayoutExternal(),
                payout.getHashTx(),
                payout.getCreatedAt(),
                payout.getProcessedAt()
        );
    }
}

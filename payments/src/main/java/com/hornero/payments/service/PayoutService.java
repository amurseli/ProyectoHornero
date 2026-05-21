package com.hornero.payments.service;

import com.hornero.payments.client.BackendClient;
import com.hornero.payments.dto.PayoutStatusResponse;
import com.hornero.payments.model.Contribution;
import com.hornero.payments.model.Payout;
import com.hornero.payments.repository.ContributionRepository;
import com.hornero.payments.repository.PayoutRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.fees.platform-rate}")
    private BigDecimal platformRate;

    @Value("${app.fees.provider-rate}")
    private BigDecimal providerRate;

    public PayoutService(PayoutRepository payoutRepository,
                         ContributionRepository contributionRepository,
                         BackendClient backendClient) {
        this.payoutRepository = payoutRepository;
        this.contributionRepository = contributionRepository;
        this.backendClient = backendClient;
    }

    // Ejecuta el payout al creador para una campaña SUCCESSFUL.
    // Solo puede llamarse una vez por campaña (idempotente: falla si ya existe un payout).
    @Transactional
    public PayoutStatusResponse executePayout(Long campaignId, Long creatorUserId) {
        if (payoutRepository.existsByIdCampaign(campaignId)) {
            throw new IllegalStateException("Ya existe un payout para la campaña " + campaignId);
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
        payout.setStatus("PROCESSING");
        payoutRepository.save(payout);

        logger.info("Iniciando payout para campaña {}: gross={} platform_fee={} provider_fee={} net={}",
                campaignId, grossAmount, platformFee, providerFee, netAmount);

        try {
            // TODO: ver como transferir este dinero a la cuenta del creador
            // Por ahora se registra el payout y queda en PROCESSING para gestión manual
            // POST https://api.mercadopago.com/v1/payouts { cbu: creatorCbu, amount: netAmount }
            // String mpPayoutId = callMpPayoutsApi(creatorCbu, netAmount);
            // payout.setIdPayoutExternal(mpPayoutId);

            // Simulación hasta que se integre la API real
            logger.warn("Payout {} en PROCESSING - integración con MP Payouts API pendiente (CBU destino: {})",
                    payout.getId(), creatorCbu);

            payout.setStatus("PROCESSING");
            payoutRepository.save(payout);

            // Una vez confirmado el payout exitoso por parte del proveedor, se actualiza el estado a COMPLETED.
            // Puede hacerse en otro proceso asíncrono cuando se integre la API real de MP Payouts.
            // payout.setStatus("COMPLETED");
            // payout.setProcessedAt(LocalDateTime.now());

        } catch (Exception e) {
            logger.error("Error al ejecutar payout para campaña {}: {}", campaignId, e.getMessage());
            payout.setStatus("FAILED");
            payoutRepository.save(payout);
            throw new RuntimeException("Error al ejecutar el payout: " + e.getMessage(), e);
        }

        return buildResponse(payout);
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
                payout.getCreatedAt(),
                payout.getProcessedAt()
        );
    }
}

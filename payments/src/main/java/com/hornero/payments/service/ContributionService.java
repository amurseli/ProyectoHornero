package com.hornero.payments.service;

import com.hornero.payments.client.BackendClient;
import com.hornero.payments.dto.ContributionRewardInfo;
import com.hornero.payments.dto.CampaignContributionSummaryResponse;
import com.hornero.payments.client.LedgerClient;
import com.hornero.payments.dto.ContributionStatusResponse;
import com.hornero.payments.dto.InitiateContributionResponse;
import com.hornero.payments.dto.ProcessContributionRequest;
import com.hornero.payments.gateway.MercadoPagoGateway;
import com.hornero.payments.model.Contribution;
import com.hornero.payments.model.Transaction;
import com.hornero.payments.repository.ContributionRepository;
import com.hornero.payments.repository.TransactionRepository;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.client.payment.PaymentPayerRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
public class ContributionService {

    private static final Logger logger = LoggerFactory.getLogger(ContributionService.class);

    private final ContributionRepository contributionRepository;
    private final TransactionRepository transactionRepository;
    private final BackendClient backendClient;
    private final LedgerClient ledgerClient;
    private final MercadoPagoGateway mercadoPagoGateway;
    private final PaymentEventLogService eventLog;

    @Value("${mercadopago.public-key}")
    private String mpPublicKey;

    public ContributionService(ContributionRepository contributionRepository,
                               TransactionRepository transactionRepository,
                               BackendClient backendClient,
                               LedgerClient ledgerClient,
                               MercadoPagoGateway mercadoPagoGateway,
                               PaymentEventLogService eventLog) {
        this.contributionRepository = contributionRepository;
        this.transactionRepository = transactionRepository;
        this.backendClient = backendClient;
        this.ledgerClient = ledgerClient;
        this.mercadoPagoGateway = mercadoPagoGateway;
        this.eventLog = eventLog;
    }

    // Crea el registro PENDING y devuelve la publicKey para que el frontend inicialice el Payment Brick
    @Transactional
    public InitiateContributionResponse initiate(Long campaignId, Long userId, BigDecimal amount, Long rewardId) {
        backendClient.validateCampaign(campaignId);

        ContributionSnapshot snapshot = getContributionSnapshot(userId, campaignId);
        RewardSelection selection = resolveRewardSelection(campaignId, amount, rewardId, snapshot);

        Contribution contribution = new Contribution();
        contribution.setIdCampaign(campaignId);
        contribution.setIdUser(userId);
        contribution.setAmount(selection.amount());
        contribution.setRewardId(selection.rewardId());
        contribution.setRewardPrice(selection.rewardPrice());
        contribution.setStatus(selection.requiresPayment() ? "PENDING" : "APPROVED");
        contributionRepository.save(contribution);

        logger.info("Contribucion {} iniciada: user={} campaign={} amount={} reward={}", contribution.getId(), userId, campaignId, selection.amount(), selection.rewardId());
        eventLog.logContributionInitiated(contribution.getId(), userId, campaignId, selection.amount());

        return new InitiateContributionResponse(
                contribution.getId(),
                mpPublicKey,
                selection.amount(),
                "ARS",
                toRewardInfo(selection),
                contribution.getStatus()
        );
    }

    // Procesa el pago con MercadoPago y actualiza los estados
    @Transactional
    public ContributionStatusResponse process(Long contributionId, Long userId, ProcessContributionRequest req) {
        Contribution contribution = contributionRepository.findById(contributionId)
                .orElseThrow(() -> new IllegalArgumentException("Contribucion no encontrada: " + contributionId));

        if (!contribution.getIdUser().equals(userId)) {
            throw new SecurityException("No autorizado para procesar esta contribucion");
        }

        if (!"PENDING".equals(contribution.getStatus())) {
            throw new IllegalStateException("La contribucion ya fue procesada. Estado actual: " + contribution.getStatus());
        }

        // Validar que la campana sigue activa antes de cobrar
        backendClient.validateCampaign(contribution.getIdCampaign());

        // Crear el registro de transaccion
        Transaction transaction = new Transaction();
        transaction.setContribution(contribution);
        transaction.setAmount(contribution.getAmount());
        transaction.setTransactionMethod("CARD");
        transaction.setPaymentProvider("MERCADO_PAGO");

        try {
            // Llamar a MercadoPago
            PaymentCreateRequest mpRequest = PaymentCreateRequest.builder()
                    .transactionAmount(contribution.getAmount())
                    .token(req.getToken())
                    .paymentMethodId(req.getPaymentMethodId())
                    .installments(req.getInstallments())
                    .payer(PaymentPayerRequest.builder()
                            .email(req.getPayerEmail())
                            .build())
                    .build();

            Payment mpPayment = mercadoPagoGateway.create(mpRequest);

            transaction.setIdTransactionExternal(String.valueOf(mpPayment.getId()));

            String newStatus = mapProviderStatus(mpPayment.getStatus().toString());
            transactionRepository.save(transaction);

            contribution.setStatus(newStatus);
            contributionRepository.save(contribution);

            if ("APPROVED".equals(newStatus)) {
                try {
                    String campaignTitle = backendClient.getCampaignTitle(contribution.getIdCampaign());
                    String username = backendClient.getUsername(contribution.getIdUser());
                    transaction.setHashTx(ledgerClient.registerContributionTransaction(username, transaction, campaignTitle));
                    transactionRepository.save(transaction);
                } catch (Exception e) {
                    logger.error("Error registrando contribucion {} en blockchain: {}", contributionId, e.getMessage());
                    transaction.setHashTx(LedgerClient.BLOCKCHAIN_REGISTRATION_FAILED);
                    transactionRepository.save(transaction);
                }
            }

            logger.info("Contribucion {} procesada. Status MP: {} -> Status local: {}", contributionId, mpPayment.getStatus(), newStatus);
            eventLog.logPaymentProcessed(contributionId, "PENDING", newStatus, String.valueOf(mpPayment.getId()));

            // Si fue aprobado, notificar al backend para actualizar current_amount
            if ("APPROVED".equals(newStatus)) {
                try {
                    backendClient.updateCampaignAmount(contribution.getIdCampaign(), contribution.getAmount());
                } catch (Exception e) {
                    logger.error("Error actualizando monto de campaña {} por contribucion {}: {}",
                            contribution.getIdCampaign(), contributionId, e.getMessage());
                }
            }

            return buildStatusResponse(contribution, transaction);

        } catch (MPApiException e) {
            String providerBody = e.getApiResponse() != null ? e.getApiResponse().getContent() : "sin response body";
            logger.error("Error de API MercadoPago al procesar contribucion {}: {} - {}", contributionId, e.getStatusCode(), providerBody);
            contribution.setStatus("REJECTED");
            contributionRepository.save(contribution);
            transactionRepository.save(transaction);
            return buildStatusResponse(contribution, transaction);
        } catch (MPException e) {
            logger.error("Error de SDK MercadoPago al procesar contribucion {}: {}", contributionId, e.getMessage());
            contribution.setStatus("REJECTED");
            contributionRepository.save(contribution);
            transactionRepository.save(transaction);
            return buildStatusResponse(contribution, transaction);
        } catch (Exception e) {
            logger.error("Error inesperado procesando contribucion {}: {}", contributionId, e.getMessage(), e);
            contribution.setStatus("REJECTED");
            contributionRepository.save(contribution);
            transactionRepository.save(transaction);
            return buildStatusResponse(contribution, transaction);
        }
    }

    // Maneja las notificaciones webhook de MercadoPago
    @Transactional
    public void handleWebhook(String type, Long paymentId) {
        if (!"payment".equals(type)) {
            return;
        }

        try {
            Payment mpPayment = mercadoPagoGateway.get(paymentId);
            String newStatus = mapProviderStatus(mpPayment.getStatus().toString());

            transactionRepository.findByIdTransactionExternal(String.valueOf(paymentId)).ifPresent(transaction -> {
                Contribution contribution = transaction.getContribution();
                String previousStatus = contribution.getStatus();

                if (!newStatus.equals(previousStatus)) {
                    contribution.setStatus(newStatus);
                    contributionRepository.save(contribution);
                    logger.info("Contribucion {} actualizada via webhook: {} -> {}", contribution.getId(), previousStatus, newStatus);
                    eventLog.logWebhookUpdate(contribution.getId(), previousStatus, newStatus, String.valueOf(paymentId));

                    if ("APPROVED".equals(newStatus) && !"APPROVED".equals(previousStatus)) {
                        backendClient.updateCampaignAmount(contribution.getIdCampaign(), contribution.getAmount());
                    }
                }
            });

        } catch (Exception e) {
            logger.error("Error procesando webhook para payment {}: {}", paymentId, e.getMessage());
        }
    }

    // Consulta el estado de una contribucion por su id
    public ContributionStatusResponse getStatus(Long contributionId, Long userId) {
        Contribution contribution = contributionRepository.findById(contributionId)
                .orElseThrow(() -> new IllegalArgumentException("Contribucion no encontrada: " + contributionId));

        if (!contribution.getIdUser().equals(userId)) {
            throw new SecurityException("No autorizado para consultar esta contribucion");
        }

        Transaction transaction = contribution.getTransaction();
        return buildStatusResponse(contribution, transaction);
    }

    public CampaignContributionSummaryResponse getCampaignContributionSummary(Long campaignId, Long userId) {
        ContributionSnapshot snapshot = getContributionSnapshot(userId, campaignId);
        return new CampaignContributionSummaryResponse(
                campaignId,
                snapshot.approvedTotal(),
                snapshot.currentRewardContribution() == null
                        ? null
                        : new ContributionRewardInfo(
                                snapshot.currentRewardContribution().getRewardId(),
                                snapshot.currentRewardContribution().getRewardPrice(),
                                null,
                                null
                        )
        );
    }

    private RewardSelection resolveRewardSelection(Long campaignId, BigDecimal amount, Long rewardId, ContributionSnapshot snapshot) {
        if (rewardId == null) {
            if (amount == null || amount.compareTo(BigDecimal.ONE) < 0) {
                throw new IllegalArgumentException("El monto minimo de contribucion es $1");
            }
            return new RewardSelection(amount, null, null, null, null, true);
        }

        BackendClient.RewardSummary selectedReward = backendClient.getCampaignReward(campaignId, rewardId);
        Contribution currentRewardContribution = snapshot.currentRewardContribution();

        if (currentRewardContribution != null) {
            if (rewardId.equals(currentRewardContribution.getRewardId())) {
                throw new IllegalStateException("Ya tenés seleccionada esta recompensa en la campaña");
            }
            if (selectedReward.getPrice().compareTo(currentRewardContribution.getRewardPrice()) <= 0) {
                throw new IllegalStateException("Solo podés cambiar a una recompensa de mayor valor");
            }
        }

        BigDecimal remaining = selectedReward.getPrice().subtract(snapshot.approvedTotal());
        if (remaining.compareTo(BigDecimal.ZERO) < 0) remaining = BigDecimal.ZERO;

        return new RewardSelection(
                remaining,
                selectedReward.getId(),
                selectedReward.getPrice(),
                currentRewardContribution != null ? currentRewardContribution.getRewardId() : null,
                currentRewardContribution != null ? currentRewardContribution.getRewardPrice() : null,
                remaining.compareTo(BigDecimal.ZERO) > 0
        );
    }

    private ContributionSnapshot getContributionSnapshot(Long userId, Long campaignId) {
        List<Contribution> contributions = contributionRepository.findByIdUserAndIdCampaign(userId, campaignId);
        Contribution currentRewardContribution = contributions.stream()
                .filter(c -> "APPROVED".equals(c.getStatus()))
                .filter(c -> c.getRewardId() != null && c.getRewardPrice() != null)
                .max(Comparator
                        .comparing(Contribution::getRewardPrice)
                        .thenComparing(Contribution::getCreatedAt))
                .orElse(null);
        BigDecimal approvedTotal = contributionRepository.sumApprovedAmountByUserAndCampaign(userId, campaignId);
        return new ContributionSnapshot(
                approvedTotal == null ? BigDecimal.ZERO : approvedTotal,
                currentRewardContribution
        );
    }

    private String mapProviderStatus(String mpStatus) {
        return switch (mpStatus.toLowerCase()) {
            case "approved"   -> "APPROVED";
            case "rejected"   -> "REJECTED";
            case "cancelled"  -> "CANCELLED";
            default           -> "IN_PROCESS"; // in_process, pending, authorized u otros, revisar bien que devuelve mp
        };
    }

    private ContributionStatusResponse buildStatusResponse(Contribution contribution, Transaction transaction) {
        ContributionStatusResponse.TransactionInfo txInfo = null;
        if (transaction != null) {
            txInfo = new ContributionStatusResponse.TransactionInfo(
                    transaction.getId(),
                    transaction.getTransactionMethod(),
                    transaction.getIdTransactionExternal(),
                    transaction.getPaymentProvider(),
                    transaction.getHashTx()
            );
        }

        ContributionRewardInfo rewardInfo = contribution.getRewardId() == null
                ? null
                : new ContributionRewardInfo(contribution.getRewardId(), contribution.getRewardPrice(), null, null);

        return new ContributionStatusResponse(
                contribution.getId(),
                contribution.getIdCampaign(),
                contribution.getAmount(),
                contribution.getStatus(),
                rewardInfo,
                txInfo
        );
    }

    private ContributionRewardInfo toRewardInfo(RewardSelection selection) {
        if (selection.rewardId() == null) return null;
        return new ContributionRewardInfo(
                selection.rewardId(),
                selection.rewardPrice(),
                selection.previousRewardId(),
                selection.previousRewardPrice()
        );
    }

    private static final class RewardSelection {
        private final BigDecimal amount;
        private final Long rewardId;
        private final BigDecimal rewardPrice;
        private final Long previousRewardId;
        private final BigDecimal previousRewardPrice;
        private final boolean requiresPayment;

        private RewardSelection(
                BigDecimal amount,
                Long rewardId,
                BigDecimal rewardPrice,
                Long previousRewardId,
                BigDecimal previousRewardPrice,
                boolean requiresPayment
        ) {
            this.amount = amount;
            this.rewardId = rewardId;
            this.rewardPrice = rewardPrice;
            this.previousRewardId = previousRewardId;
            this.previousRewardPrice = previousRewardPrice;
            this.requiresPayment = requiresPayment;
        }

        private BigDecimal amount() { return amount; }
        private Long rewardId() { return rewardId; }
        private BigDecimal rewardPrice() { return rewardPrice; }
        private Long previousRewardId() { return previousRewardId; }
        private BigDecimal previousRewardPrice() { return previousRewardPrice; }
        private boolean requiresPayment() { return requiresPayment; }
    }

    private record ContributionSnapshot(
            BigDecimal approvedTotal,
            Contribution currentRewardContribution
    ) {}
}

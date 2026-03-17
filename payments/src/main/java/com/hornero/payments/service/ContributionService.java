package com.hornero.payments.service;

import com.hornero.payments.client.BackendClient;
import com.hornero.payments.dto.ContributionStatusResponse;
import com.hornero.payments.dto.InitiateContributionResponse;
import com.hornero.payments.dto.ProcessContributionRequest;
import com.hornero.payments.model.Contribution;
import com.hornero.payments.model.Transaction;
import com.hornero.payments.repository.ContributionRepository;
import com.hornero.payments.repository.TransactionRepository;
import com.mercadopago.client.payment.PaymentClient;
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

@Service
public class ContributionService {

    private static final Logger logger = LoggerFactory.getLogger(ContributionService.class);

    private final ContributionRepository contributionRepository;
    private final TransactionRepository transactionRepository;
    private final BackendClient backendClient;

    @Value("${mercadopago.public-key}")
    private String mpPublicKey;

    public ContributionService(ContributionRepository contributionRepository,
                               TransactionRepository transactionRepository,
                               BackendClient backendClient) {
        this.contributionRepository = contributionRepository;
        this.transactionRepository = transactionRepository;
        this.backendClient = backendClient;
    }

    // Crea el registro PENDING y devuelve la publicKey para que el frontend inicialice el Payment Brick
    @Transactional
    public InitiateContributionResponse initiate(Long campaignId, Long userId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ONE) < 0) {
            throw new IllegalArgumentException("El monto minimo de contribucion es $1");
        }

        Contribution contribution = new Contribution();
        contribution.setIdCampaign(campaignId);
        contribution.setIdUser(userId);
        contribution.setAmount(amount);
        contribution.setStatus("PENDING");
        contributionRepository.save(contribution);

        logger.info("Contribucion {} iniciada: user={} campaign={} amount={}", contribution.getId(), userId, campaignId, amount);

        return new InitiateContributionResponse(contribution.getId(), mpPublicKey, amount, "ARS");
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
        // TODO: loguear estado PENDING en transaction_logs

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

            Payment mpPayment = new PaymentClient().create(mpRequest);

            transaction.setIdTransactionExternal(String.valueOf(mpPayment.getId()));
            transaction.setPaymentProvider("MERCADO_PAGO");
            transactionRepository.save(transaction);

            // TODO: loguear estado recibido de MP en transaction_logs

            // Mapear status de MercadoPago a nuestro status
            String newStatus = mapMpStatus(mpPayment.getStatus().toString());
            contribution.setStatus(newStatus);
            contributionRepository.save(contribution);

            logger.info("Contribucion {} procesada. Status MP: {} -> Status local: {}", contributionId, mpPayment.getStatus(), newStatus);

            // Si fue aprobado, notificar al backend para actualizar current_amount
            if ("APPROVED".equals(newStatus)) {
                backendClient.updateCampaignAmount(contribution.getIdCampaign(), contribution.getAmount());
            }

            return buildStatusResponse(contribution, transaction);

        } catch (MPApiException e) {
            logger.error("Error de API MercadoPago al procesar contribucion {}: {} - {}", contributionId, e.getStatusCode(), e.getApiResponse().getContent());
            contribution.setStatus("REJECTED");
            contributionRepository.save(contribution);
            transactionRepository.save(transaction);
            throw new RuntimeException("Error al procesar el pago con MercadoPago: " + e.getMessage());
        } catch (MPException e) {
            logger.error("Error de SDK MercadoPago al procesar contribucion {}: {}", contributionId, e.getMessage());
            contribution.setStatus("REJECTED");
            contributionRepository.save(contribution);
            transactionRepository.save(transaction);
            throw new RuntimeException("Error de conexion con MercadoPago: " + e.getMessage());
        }
    }

    // Maneja las notificaciones webhook de MercadoPago
    @Transactional
    public void handleWebhook(String type, Long paymentId) {
        if (!"payment".equals(type)) {
            return;
        }

        try {
            Payment mpPayment = new PaymentClient().get(paymentId);
            String newStatus = mapMpStatus(mpPayment.getStatus().toString());

            transactionRepository.findByIdTransactionExternal(String.valueOf(paymentId)).ifPresent(transaction -> {
                Contribution contribution = transaction.getContribution();
                String previousStatus = contribution.getStatus();

                // TODO: loguear estado actualizado en transaction_logs

                if (!newStatus.equals(previousStatus)) {
                    contribution.setStatus(newStatus);
                    contributionRepository.save(contribution);
                    logger.info("Contribucion {} actualizada via webhook: {} -> {}", contribution.getId(), previousStatus, newStatus);

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

    private String mapMpStatus(String mpStatus) {
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
                    transaction.getPaymentProvider()
            );
        }
        return new ContributionStatusResponse(
                contribution.getId(),
                contribution.getIdCampaign(),
                contribution.getAmount(),
                contribution.getStatus(),
                txInfo
        );
    }
}

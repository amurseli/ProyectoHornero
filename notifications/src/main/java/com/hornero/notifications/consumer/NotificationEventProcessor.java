package com.hornero.notifications.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hornero.notifications.dto.ContributorSummary;
import com.hornero.notifications.dto.event.CampaignFinalizedEvent;
import com.hornero.notifications.dto.event.ContributionApprovedEvent;
import com.hornero.notifications.dto.event.PayoutCompletedEvent;
import com.hornero.notifications.model.Notification;
import com.hornero.notifications.model.ProcessedEvent;
import com.hornero.notifications.repository.NotificationRepository;
import com.hornero.notifications.repository.ProcessedEventRepository;
import com.hornero.notifications.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

// Rutea cada evento del Redis Stream a su manejador: crea la notificacion in-app
// correspondiente y dispara el mail asociado.
//
// El chequeo de idempotencia, el procesamiento y el marcado del evento como procesado
// ocurren en una unica transaccion: si algo falla a mitad de camino, se revierte todo
// y el evento queda pendiente para ser reintentado por el consumer group de Redis.
@Service
public class NotificationEventProcessor {

    private static final Logger logger = LoggerFactory.getLogger(NotificationEventProcessor.class);

    private static final String TYPE_CONTRIBUTION_APPROVED = "CONTRIBUTION_APPROVED";
    private static final String TYPE_CAMPAIGN_SUCCEEDED = "CAMPAIGN_SUCCEEDED";
    private static final String TYPE_CAMPAIGN_FAILED = "CAMPAIGN_FAILED";
    private static final String TYPE_PAYOUT_COMPLETED = "PAYOUT_COMPLETED";

    private final NotificationRepository notificationRepository;
    private final ProcessedEventRepository processedEventRepository;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    @Value("${app.admin.email}")
    private String adminEmail;

    public NotificationEventProcessor(NotificationRepository notificationRepository,
                                       ProcessedEventRepository processedEventRepository,
                                       EmailService emailService,
                                       ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.processedEventRepository = processedEventRepository;
        this.emailService = emailService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void processIfNew(String eventId, String type, String payload) {
        if (processedEventRepository.existsById(eventId)) {
            logger.info("Evento {} ya procesado anteriormente, se omite (idempotencia)", eventId);
            return;
        }

        try {
            route(eventId, type, payload);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "No se pudo procesar el evento " + eventId + " de tipo '" + type + "': " + e.getMessage(), e);
        }

        processedEventRepository.save(new ProcessedEvent(eventId));
    }

    private void route(String eventId, String type, String payload) throws Exception {
        switch (type) {
            case TYPE_CONTRIBUTION_APPROVED -> handleContributionApproved(eventId, payload);
            case TYPE_CAMPAIGN_SUCCEEDED -> handleCampaignSucceeded(eventId, payload);
            case TYPE_CAMPAIGN_FAILED -> handleCampaignFailed(eventId, payload);
            case TYPE_PAYOUT_COMPLETED -> handlePayoutCompleted(eventId, payload);
            default -> logger.warn("Tipo de evento desconocido '{}' (evento {}), se omite sin procesar", type, eventId);
        }
    }

    private void handleContributionApproved(String eventId, String payload) throws Exception {
        ContributionApprovedEvent event = objectMapper.readValue(payload, ContributionApprovedEvent.class);

        saveNotification(event.getUserId(), "DONATION_SUCCESS",
                "Aporte confirmado",
                String.format("Tu aporte de %s a \"%s\" fue confirmado con éxito.",
                        formatAmount(event.getAmount()), event.getCampaignTitle()),
                event.getCampaignId());

        emailService.sendDonationSuccessEmail(eventId, event.getUserEmail(), event.getUserFirstName(),
                event.getCampaignTitle(), event.getAmount());
    }

    private void handleCampaignSucceeded(String eventId, String payload) throws Exception {
        CampaignFinalizedEvent event = objectMapper.readValue(payload, CampaignFinalizedEvent.class);

        for (CampaignFinalizedEvent.ContributorInfo contributor : event.getContributors()) {
            saveNotification(contributor.getUserId(), "CAMPAIGN_SUCCEEDED_CONTRIBUTOR",
                    "¡Una campaña que apoyaste alcanzó su objetivo!",
                    String.format("La campaña \"%s\" alcanzó su objetivo de financiamiento. ¡Gracias por tu aporte!",
                            event.getCampaignTitle()),
                    event.getCampaignId());

            emailService.sendCampaignSucceededContributorEmail(eventId, contributor.getEmail(), contributor.getFirstName(),
                    event.getCampaignTitle(), contributor.getAmount());
        }

        CampaignFinalizedEvent.CreatorInfo creator = event.getCreator();

        saveNotification(creator.getUserId(), "CAMPAIGN_SUCCEEDED_CREATOR",
                "¡Tu campaña alcanzó su objetivo!",
                String.format("Tu campaña \"%s\" alcanzó su objetivo, recaudando %s.",
                        event.getCampaignTitle(), formatAmount(event.getRaisedAmount())),
                event.getCampaignId());

        List<ContributorSummary> summaries = event.getContributors().stream()
                .map(c -> new ContributorSummary(c.getFirstName(), c.getAmount()))
                .toList();

        emailService.sendCampaignSucceededCreatorEmail(eventId, creator.getEmail(), creator.getFirstName(),
                event.getCampaignTitle(), event.getRaisedAmount(), summaries);

        emailService.sendAdminTransferPendingEmail(eventId, adminEmail, event.getCampaignTitle(),
                creator.getFirstName(), event.getRaisedAmount());
    }

    private void handleCampaignFailed(String eventId, String payload) throws Exception {
        CampaignFinalizedEvent event = objectMapper.readValue(payload, CampaignFinalizedEvent.class);

        for (CampaignFinalizedEvent.ContributorInfo contributor : event.getContributors()) {
            saveNotification(contributor.getUserId(), "CAMPAIGN_FAILED_CONTRIBUTOR",
                    "Una campaña que apoyaste no alcanzó su objetivo",
                    String.format("La campaña \"%s\" no alcanzó su objetivo de financiamiento. Tu dinero te será devuelto.",
                            event.getCampaignTitle()),
                    event.getCampaignId());

            emailService.sendCampaignFailedContributorEmail(eventId, contributor.getEmail(), contributor.getFirstName(),
                    event.getCampaignTitle(), contributor.getAmount());
        }

        CampaignFinalizedEvent.CreatorInfo creator = event.getCreator();

        saveNotification(creator.getUserId(), "CAMPAIGN_FAILED_CREATOR",
                "Tu campaña no alcanzó su objetivo",
                String.format("Tu campaña \"%s\" no alcanzó su objetivo de financiamiento.", event.getCampaignTitle()),
                event.getCampaignId());

        emailService.sendCampaignFailedCreatorEmail(eventId, creator.getEmail(), creator.getFirstName(),
                event.getCampaignTitle(), event.getRaisedAmount(), event.getTargetAmount());
    }

    private void handlePayoutCompleted(String eventId, String payload) throws Exception {
        PayoutCompletedEvent event = objectMapper.readValue(payload, PayoutCompletedEvent.class);

        saveNotification(event.getCreatorId(), "PAYOUT_COMPLETED",
                "Transferencia realizada",
                String.format("Te transferimos %s recaudados por tu campaña \"%s\".",
                        formatAmount(event.getAmountTransferred()), event.getCampaignTitle()),
                event.getCampaignId());

        emailService.sendPayoutCompletedEmail(eventId, event.getCreatorEmail(), event.getCreatorFirstName(),
                event.getCampaignTitle(), event.getAmountTransferred());
    }

    private void saveNotification(Long userId, String type, String title, String message, Long campaignId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setCampaignId(campaignId);
        notificationRepository.save(notification);
    }

    private String formatAmount(BigDecimal amount) {
        return String.format("$%,.2f", amount);
    }
}

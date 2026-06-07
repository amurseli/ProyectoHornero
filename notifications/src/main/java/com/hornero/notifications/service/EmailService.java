package com.hornero.notifications.service;

import com.hornero.notifications.dto.ContributorSummary;
import com.hornero.notifications.model.EmailLog;
import com.hornero.notifications.repository.EmailLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

// Envia los mails de cada tipo de notificacion y deja registro en email_log.
//
// A diferencia del EmailService del backend, este NO relanza excepciones: un mail
// que falla no debe frenar el procesamiento del evento (la notificacion in-app igual
// se crea). La falla queda registrada en email_log para su revision posterior.
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private static final String STATUS_SENT = "SENT";
    private static final String STATUS_FAILED = "FAILED";

    private final JavaMailSender mailSender;
    private final EmailLogRepository emailLogRepository;

    @Value("${app.email.from:noreply@proyectohornero.com}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender, EmailLogRepository emailLogRepository) {
        this.mailSender = mailSender;
        this.emailLogRepository = emailLogRepository;
    }

    public void sendDonationSuccessEmail(String eventId, String email, String firstName,
                                          String campaignTitle, BigDecimal amount) {
        send(eventId, email, "DONATION_SUCCESS",
                "Donación confirmada - Proyecto Hornero",
                buildDonationSuccessBody(firstName, campaignTitle, amount));
    }

    private String buildDonationSuccessBody(String firstName, String campaignTitle, BigDecimal amount) {
        return String.format(
            """
            ¡Hola %s!

            Tu donación fue confirmada con éxito.

            Campaña: %s
            Monto donado: %s

            Gracias por apoyar este proyecto. Te avisaremos por acá cuando la campaña
            llegue a su fecha límite para contarte si alcanzó su objetivo.

            Saludos,
            El equipo de Proyecto Hornero
            """,
            displayName(firstName), campaignTitle, formatAmount(amount)
        );
    }

    public void sendCampaignSucceededContributorEmail(String eventId, String email, String firstName,
                                                       String campaignTitle, BigDecimal amount) {
        send(eventId, email, "CAMPAIGN_SUCCEEDED_CONTRIBUTOR",
                "¡La campaña que apoyaste llegó a su objetivo! - Proyecto Hornero",
                buildCampaignSucceededContributorBody(firstName, campaignTitle, amount));
    }

    private String buildCampaignSucceededContributorBody(String firstName, String campaignTitle, BigDecimal amount) {
        return String.format(
            """
            ¡Hola %s!

            Buenas noticias: la campaña "%s", a la que aportaste %s, alcanzó su objetivo
            de financiamiento.

            El dinero recaudado será transferido a quien la creó para que pueda llevar
            adelante el proyecto. ¡Gracias por ser parte!

            Saludos,
            El equipo de Proyecto Hornero
            """,
            displayName(firstName), campaignTitle, formatAmount(amount)
        );
    }

    public void sendCampaignFailedContributorEmail(String eventId, String email, String firstName,
                                                    String campaignTitle, BigDecimal amount) {
        send(eventId, email, "CAMPAIGN_FAILED_CONTRIBUTOR",
                "La campaña que apoyaste no alcanzó su objetivo - Proyecto Hornero",
                buildCampaignFailedContributorBody(firstName, campaignTitle, amount));
    }

    private String buildCampaignFailedContributorBody(String firstName, String campaignTitle, BigDecimal amount) {
        return String.format(
            """
            Hola %s,

            La campaña "%s", a la que aportaste %s, no alcanzó su objetivo de
            financiamiento antes de la fecha límite.

            Como corresponde en estos casos, tu dinero te será devuelto. La acreditación
            puede demorar algunos días hábiles según el medio de pago utilizado.

            Gracias igualmente por haber apoyado este proyecto.

            Saludos,
            El equipo de Proyecto Hornero
            """,
            displayName(firstName), campaignTitle, formatAmount(amount)
        );
    }

    public void sendCampaignSucceededCreatorEmail(String eventId, String email, String firstName, String campaignTitle,
                                                   BigDecimal raisedAmount, List<ContributorSummary> contributors) {
        send(eventId, email, "CAMPAIGN_SUCCEEDED_CREATOR",
                "¡Tu campaña alcanzó su objetivo! - Proyecto Hornero",
                buildCampaignSucceededCreatorBody(firstName, campaignTitle, raisedAmount, contributors));
    }

    private String buildCampaignSucceededCreatorBody(String firstName, String campaignTitle,
                                                      BigDecimal raisedAmount, List<ContributorSummary> contributors) {
        return String.format(
            """
            ¡Felicitaciones %s!

            Tu campaña "%s" alcanzó su objetivo de financiamiento, recaudando un total de %s.

            En los próximos días te transferiremos el dinero recaudado. Te avisaremos
            por este medio en cuanto la transferencia se haga efectiva.

            Detalle de las personas que aportaron a tu campaña:
            %s

            ¡Gracias por confiar en Proyecto Hornero!

            Saludos,
            El equipo de Proyecto Hornero
            """,
            displayName(firstName), campaignTitle, formatAmount(raisedAmount), buildContributorList(contributors)
        );
    }

    public void sendCampaignFailedCreatorEmail(String eventId, String email, String firstName,
                                                String campaignTitle, BigDecimal raisedAmount, BigDecimal targetAmount) {
        send(eventId, email, "CAMPAIGN_FAILED_CREATOR",
                "Tu campaña no alcanzó su objetivo - Proyecto Hornero",
                buildCampaignFailedCreatorBody(firstName, campaignTitle, raisedAmount, targetAmount));
    }

    private String buildCampaignFailedCreatorBody(String firstName, String campaignTitle,
                                                   BigDecimal raisedAmount, BigDecimal targetAmount) {
        return String.format(
            """
            Hola %s,

            Tu campaña "%s" llegó a su fecha límite sin alcanzar el objetivo de
            financiamiento. Se recaudaron %s de los %s necesarios.

            Conforme a las reglas de la plataforma, el dinero aportado será devuelto
            a cada contribuyente.

            Si querés, podés volver a lanzar tu proyecto más adelante con una nueva campaña.

            Saludos,
            El equipo de Proyecto Hornero
            """,
            displayName(firstName), campaignTitle, formatAmount(raisedAmount), formatAmount(targetAmount)
        );
    }

    public void sendPayoutCompletedEmail(String eventId, String email, String firstName,
                                          String campaignTitle, BigDecimal amountTransferred) {
        send(eventId, email, "PAYOUT_COMPLETED",
                "Transferencia realizada - Proyecto Hornero",
                buildPayoutCompletedBody(firstName, campaignTitle, amountTransferred));
    }

    private String buildPayoutCompletedBody(String firstName, String campaignTitle, BigDecimal amountTransferred) {
        return String.format(
            """
            ¡Hola %s!

            Te confirmamos que ya transferimos el dinero recaudado por tu campaña "%s".

            Monto transferido: %s

            Por favor verificá la acreditación en tu cuenta. Ante cualquier inconveniente,
            podés contactarnos respondiendo este correo.

            Saludos,
            El equipo de Proyecto Hornero
            """,
            displayName(firstName), campaignTitle, formatAmount(amountTransferred)
        );
    }

    public void sendAdminTransferPendingEmail(String eventId, String adminEmail, String campaignTitle,
                                               String creatorFirstName, BigDecimal raisedAmount) {
        send(eventId, adminEmail, "ADMIN_TRANSFER_PENDING",
                "Transferencia pendiente - Campaña cerrada con éxito",
                buildAdminTransferPendingBody(campaignTitle, creatorFirstName, raisedAmount));
    }

    private String buildAdminTransferPendingBody(String campaignTitle, String creatorFirstName, BigDecimal raisedAmount) {
        return String.format(
            """
            Hola,

            La campaña "%s" cerró habiendo alcanzado su objetivo de financiamiento,
            con un total recaudado de %s.

            Corresponde gestionar la transferencia del dinero a quien la creó (%s).

            Este es un aviso automático del sistema de notificaciones de Proyecto Hornero.
            """,
            campaignTitle, formatAmount(raisedAmount), displayName(creatorFirstName)
        );
    }

    private String buildContributorList(List<ContributorSummary> contributors) {
        if (contributors == null || contributors.isEmpty()) {
            return "(sin detalle disponible)";
        }

        return contributors.stream()
                .map(c -> String.format("- %s: %s", displayName(c.getFirstName()), formatAmount(c.getAmount())))
                .collect(Collectors.joining("\n"));
    }

    private String displayName(String firstName) {
        return (firstName != null && !firstName.isBlank()) ? firstName : "Usuario";
    }

    private String formatAmount(BigDecimal amount) {
        return String.format("$%,.2f", amount);
    }

    private void send(String eventId, String to, String type, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);

            logger.info("{} email sent successfully to: {}", type, to);
            logEmail(eventId, to, type, STATUS_SENT, null);
        } catch (Exception e) {
            logger.error("Failed to send {} email to: {}", type, to, e);
            logEmail(eventId, to, type, STATUS_FAILED, e.getMessage());
        }
    }

    private void logEmail(String eventId, String recipientEmail, String type, String status, String errorMessage) {
        EmailLog log = new EmailLog();
        log.setEventId(eventId);
        log.setRecipientEmail(recipientEmail);
        log.setType(type);
        log.setStatus(status);
        log.setErrorMessage(errorMessage);
        emailLogRepository.save(log);
    }
}

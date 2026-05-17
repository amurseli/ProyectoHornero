package com.hornero.client;

import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

// Cliente HTTP para comunicacion interna con el payments service.
// Usa X-Service-Key para autenticacion entre servicios.
@Component
public class PaymentsServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(PaymentsServiceClient.class);

    private final RestTemplate restTemplate;

    @Value("${payments.service.url}")
    private String paymentsUrl;

    @Value("${app.service-key}")
    private String serviceKey;

    public PaymentsServiceClient() {
        HttpComponentsClientHttpRequestFactory factory =
                new HttpComponentsClientHttpRequestFactory(HttpClients.createDefault());
        this.restTemplate = new RestTemplate(factory);
    }

    public void triggerPayout(Long campaignId) {
        String url = paymentsUrl + "/api/payments/campaigns/" + campaignId + "/payout";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        try {
            restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
            logger.info("Payout disparado para campaña {}", campaignId);
        } catch (Exception e) {
            logger.error("Error al disparar payout para campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al disparar payout para campaña " + campaignId, e);
        }
    }

    public void triggerRefundAll(Long campaignId) {
        String url = paymentsUrl + "/api/payments/campaigns/" + campaignId + "/refund-all?reason=CAMPAIGN_FAILED";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        try {
            restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
            logger.info("Refund-all disparado para campaña {}", campaignId);
        } catch (Exception e) {
            logger.error("Error al disparar refund-all para campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al disparar refund-all para campaña " + campaignId, e);
        }
    }

    public void triggerRetryFailedRefunds(Long campaignId) {
        String url = paymentsUrl + "/api/payments/campaigns/" + campaignId + "/retry-failed-refunds";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        try {
            restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
            logger.info("Retry de refunds fallidos disparado para campaña {}", campaignId);
        } catch (Exception e) {
            logger.error("Error al reintentar refunds fallidos para campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al reintentar refunds fallidos para campaña " + campaignId, e);
        }
    }
}

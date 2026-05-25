package com.hornero.client;

import com.hornero.dto.AdminCampaignPayoutResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.Map;

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

    public void triggerPayout(Long campaignId, Long creatorUserId) {
        String url = paymentsUrl + "/api/payments/campaigns/" + campaignId + "/payout";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);
        Map<String, Long> body = Map.of("creatorUserId", creatorUserId);
        HttpEntity<Map<String, Long>> entity = new HttpEntity<>(body, headers);
        try {
            restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
            logger.info("Payout disparado para campaña {}", campaignId);
        } catch (Exception e) {
            logger.error("Error al disparar payout para campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al disparar payout para campaña " + campaignId, e);
        }
    }

    public AdminCampaignPayoutResponse createOrGetPayout(Long campaignId, Long creatorUserId) {
        String url = paymentsUrl + "/api/payments/campaigns/" + campaignId + "/payout";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);
        Map<String, Long> body = Map.of("creatorUserId", creatorUserId);
        HttpEntity<Map<String, Long>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<AdminCampaignPayoutResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, AdminCampaignPayoutResponse.class);
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            String detail = extractErrorMessage(e.getResponseBodyAsString());
            logger.error("Error al crear/consultar payout para campaña {}: {}", campaignId, detail);
            throw new RuntimeException(detail);
        } catch (Exception e) {
            logger.error("Error al crear/consultar payout para campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al preparar payout para campaña " + campaignId, e);
        }
    }

    public AdminCampaignPayoutResponse confirmPayout(Long campaignId, String transferReference) {
        String url = paymentsUrl + "/api/payments/campaigns/" + campaignId + "/payout/confirm";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);
        Map<String, String> body = transferReference == null || transferReference.isBlank()
                ? Map.of()
                : Map.of("mpTransferReference", transferReference);
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<AdminCampaignPayoutResponse> response = restTemplate.exchange(
                    url, HttpMethod.PATCH, entity, AdminCampaignPayoutResponse.class);
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            String detail = extractErrorMessage(e.getResponseBodyAsString());
            logger.error("Error al confirmar payout para campaña {}: {}", campaignId, detail);
            throw new RuntimeException(detail);
        } catch (Exception e) {
            logger.error("Error al confirmar payout para campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al confirmar payout para campaña " + campaignId, e);
        }
    }

    public void triggerRefundAll(Long campaignId) {
        String url = paymentsUrl + "/api/payments/campaigns/" + campaignId + "/refund-all";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);
        Map<String, String> body = Map.of("reason", "CAMPAIGN_FAILED");
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
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

    private String extractErrorMessage(String body) {
        if (body == null || body.isBlank()) {
            return "Error al preparar payout";
        }

        String[] keys = { "\"message\":\"", "\"error\":\"" };
        for (String key : keys) {
            int start = body.indexOf(key);
            if (start >= 0) {
                int from = start + key.length();
                int end = body.indexOf('"', from);
                if (end > from) {
                    return body.substring(from, end);
                }
            }
        }

        return body;
    }
}

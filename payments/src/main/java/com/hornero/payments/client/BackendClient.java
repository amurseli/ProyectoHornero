package com.hornero.payments.client;

import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

// Cliente HTTP para comunicacion interna con el backend.
// Usa X-Service-Key para autenticacion entre servicios.
@Component
public class BackendClient {

    public static class RewardSummary {
        private final Long id;
        private final String title;
        private final BigDecimal price;

        public RewardSummary(Long id, String title, BigDecimal price) {
            this.id = id;
            this.title = title;
            this.price = price;
        }

        public Long getId() { return id; }
        public String getTitle() { return title; }
        public BigDecimal getPrice() { return price; }
    }

    private static final Logger logger = LoggerFactory.getLogger(BackendClient.class);

    private final RestTemplate restTemplate;

    @Value("${app.backend.url}")
    private String backendUrl;

    @Value("${app.service-key}")
    private String serviceKey;

    public BackendClient() {
        // HttpComponentsClientHttpRequestFactory soporta PATCH, el cliente por defecto de Java no
        HttpComponentsClientHttpRequestFactory factory =
                new HttpComponentsClientHttpRequestFactory(HttpClients.createDefault());
        this.restTemplate = new RestTemplate(factory);
    }

    // Valida que la campana existe, esta en status CROWDFUNDING y no vencio su fecha.
    // Lanza IllegalStateException si la campana no es valida para recibir contribuciones.
    public void validateCampaign(Long campaignId) {
        String url = backendUrl + "/api/campaigns/" + campaignId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Service-Key", serviceKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<?, ?> campaign = response.getBody();

            if (campaign == null) {
                throw new IllegalStateException("Campana no encontrada: " + campaignId);
            }

            String status = (String) campaign.get("status");
            if (!"CROWDFUNDING".equals(status)) {
                throw new IllegalStateException("La campana no esta activa para recibir contribuciones. Estado actual: " + status);
            }

            String endDateStr = (String) campaign.get("endDate");
            if (endDateStr != null) {
                LocalDate endDate = LocalDate.parse(endDateStr);
                if (LocalDate.now().isAfter(endDate)) {
                    throw new IllegalStateException("La campana ya finalizo el " + endDateStr);
                }
            }

            logger.info("Campana {} validada correctamente", campaignId);

        } catch (HttpClientErrorException.NotFound e) {
            throw new IllegalStateException("Campana no encontrada: " + campaignId);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error al validar campana {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al comunicarse con el backend para validar la campana", e);
        }
    }

    public String getCampaignTitle(Long campaignId) {
        String url = backendUrl + "/api/campaigns/" + campaignId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Service-Key", serviceKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<?, ?> campaign = response.getBody();

            if (campaign == null || campaign.get("title") == null) {
                throw new IllegalStateException("Campaña no encontrada: " + campaignId);
            }

            return String.valueOf(campaign.get("title"));
        } catch (HttpClientErrorException.NotFound e) {
            throw new IllegalStateException("Campaña no encontrada: " + campaignId);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error al obtener título de campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al comunicarse con el backend para obtener la campaña", e);
        }
    }

    public RewardSummary getCampaignReward(Long campaignId, Long rewardId) {
        String url = backendUrl + "/api/campaigns/" + campaignId + "/rewards";

        try {
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity.EMPTY, List.class);
            List<?> rewards = response.getBody();

            if (rewards == null) {
                throw new IllegalStateException("La campaña no tiene recompensas configuradas");
            }

            for (Object item : rewards) {
                if (!(item instanceof Map<?, ?> reward)) continue;
                Long currentId = asLong(reward.get("id"));
                if (currentId != null && currentId.equals(rewardId)) {
                    BigDecimal price = asBigDecimal(reward.get("price"));
                    if (price == null) {
                        throw new IllegalStateException("La recompensa seleccionada no tiene precio válido");
                    }
                    return new RewardSummary(currentId, String.valueOf(reward.get("title")), price);
                }
            }

            throw new IllegalStateException("La recompensa seleccionada no existe en esta campaña");
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error al obtener recompensa {} de campaña {}: {}", rewardId, campaignId, e.getMessage());
            throw new RuntimeException("Error al comunicarse con el backend para obtener la recompensa", e);
        }
    }

    public String getUsername(Long userId) {
        String url = backendUrl + "/api/users/" + userId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Service-Key", serviceKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<?, ?> user = response.getBody();

            if (user == null || user.get("userName") == null) {
                throw new IllegalStateException("Usuario no encontrado: " + userId);
            }

            return String.valueOf(user.get("userName"));
        } catch (HttpClientErrorException.NotFound e) {
            throw new IllegalStateException("Usuario no encontrado: " + userId);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error al obtener username de usuario {}: {}", userId, e.getMessage());
            throw new RuntimeException("Error al comunicarse con el backend para obtener el usuario", e);
        }
    }

    // Valida que la campaña está en status SUCCESSFUL antes de ejecutar el payout.
    // Lanza IllegalStateException si no está en ese estado.
    public void validateCampaignSuccessful(Long campaignId) {
        String url = backendUrl + "/api/campaigns/" + campaignId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Service-Key", serviceKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<?, ?> campaign = response.getBody();

            if (campaign == null) {
                throw new IllegalStateException("Campaña no encontrada: " + campaignId);
            }

            String status = (String) campaign.get("status");
            if (!"SUCCESSFUL".equals(status)) {
                throw new IllegalStateException("La campaña no está en estado SUCCESSFUL para procesar el payout. Estado actual: " + status);
            }

        } catch (HttpClientErrorException.NotFound e) {
            throw new IllegalStateException("Campaña no encontrada: " + campaignId);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error al validar estado de campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al comunicarse con el backend para validar la campaña", e);
        }
    }

    // Obtiene el CBU o email de MP del creador para ejecutar el payout.
    // Lanza IllegalStateException si el creador no tiene info de payout configurada.
    public String getCreatorPayoutCbu(Long creatorUserId) {
        String url = backendUrl + "/api/users/" + creatorUserId + "/payout-info";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Service-Key", serviceKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<?, ?> payoutInfo = response.getBody();

            if (payoutInfo == null || payoutInfo.get("cbu") == null) {
                throw new IllegalStateException("El creador no tiene CBU configurado para recibir pagos");
            }

            return (String) payoutInfo.get("cbu");

        } catch (HttpClientErrorException.NotFound e) {
            throw new IllegalStateException("El creador no tiene información de payout configurada");
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error al obtener payout-info del creador {}: {}", creatorUserId, e.getMessage());
            throw new RuntimeException("Error al comunicarse con el backend para obtener info del creador", e);
        }
    }

    // Informa al backend el estado financiero final de una campaña (ej. PAYOUT_COMPLETED, REFUND_COMPLETED).
    public void updateCampaignMoneyStatus(Long campaignId, String moneyStatus) {
        String url = backendUrl + "/api/campaigns/" + campaignId + "/money-status";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);

        Map<String, String> body = Map.of("moneyStatus", moneyStatus);
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            restTemplate.exchange(url, HttpMethod.PATCH, entity, Void.class);
            logger.info("Money status de campaña {} actualizado a {}", campaignId, moneyStatus);
        } catch (Exception e) {
            logger.error("Error al actualizar money status de campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al actualizar money status en el backend", e);
        }
    }

    // Suma el monto al current_amount de la campana en el backend.
    public void updateCampaignAmount(Long campaignId, BigDecimal amount) {
        String url = backendUrl + "/api/campaigns/" + campaignId + "/current-amount";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);

        Map<String, BigDecimal> body = Map.of("amount", amount);
        HttpEntity<Map<String, BigDecimal>> entity = new HttpEntity<>(body, headers);

        try {
            restTemplate.exchange(url, HttpMethod.PATCH, entity, Void.class);
            logger.info("Current amount de campana {} actualizado en +{}", campaignId, amount);
        } catch (Exception e) {
            logger.error("Error al actualizar monto de campana {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al actualizar el monto de la campana en el backend", e);
        }
    }

    private Long asLong(Object value) {
        if (value instanceof Number number) return number.longValue();
        if (value instanceof String text && !text.isBlank()) return Long.valueOf(text);
        return null;
    }

    private BigDecimal asBigDecimal(Object value) {
        if (value instanceof BigDecimal decimal) return decimal;
        if (value instanceof Number number) return new BigDecimal(number.toString());
        if (value instanceof String text && !text.isBlank()) return new BigDecimal(text);
        return null;
    }
}

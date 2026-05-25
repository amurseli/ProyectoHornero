package com.hornero.payments.controller;

import com.hornero.payments.dto.ContributionStatusResponse;
import com.hornero.payments.dto.CampaignContributionSummaryResponse;
import com.hornero.payments.dto.InitiateContributionRequest;
import com.hornero.payments.dto.InitiateContributionResponse;
import com.hornero.payments.dto.ProcessContributionRequest;
import com.hornero.payments.service.ContributionService;
import com.hornero.payments.util.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class ContributionController {

    private static final Logger logger = LoggerFactory.getLogger(ContributionController.class);

    private final ContributionService contributionService;
    private final JwtUtil jwtUtil;

    public ContributionController(ContributionService contributionService, JwtUtil jwtUtil) {
        this.contributionService = contributionService;
        this.jwtUtil = jwtUtil;
    }

    // POST /api/payments/contributions/initiate
    // Frontend llama esto primero para obtener contributionId + publicKey del Brick
    @PostMapping("/contributions/initiate")
    public ResponseEntity<InitiateContributionResponse> initiate(
            @RequestBody InitiateContributionRequest request,
            HttpServletRequest httpRequest) {

        Long userId = extractUserIdFromRequest(httpRequest);

        InitiateContributionResponse response = contributionService.initiate(
                request.getCampaignId(),
                userId,
                request.getAmount(),
                request.getRewardId()
        );

        return ResponseEntity.status(201).body(response);
    }

    // POST /api/payments/contributions/{id}/process
    // Frontend manda el formData del Payment Brick para procesar el cobro
    @PostMapping("/contributions/{id}/process")
    public ResponseEntity<ContributionStatusResponse> process(
            @PathVariable Long id,
            @RequestBody ProcessContributionRequest request,
            HttpServletRequest httpRequest) {

        Long userId = extractUserIdFromRequest(httpRequest);

        ContributionStatusResponse response = contributionService.process(id, userId, request);
        return ResponseEntity.ok(response);
    }

    // GET /api/payments/contributions/{id}
    // Consulta el estado de una contribucion
    @GetMapping("/contributions/{id}")
    public ResponseEntity<ContributionStatusResponse> getStatus(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {

        Long userId = extractUserIdFromRequest(httpRequest);

        ContributionStatusResponse response = contributionService.getStatus(id, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/campaigns/{campaignId}/summary")
    public ResponseEntity<CampaignContributionSummaryResponse> getCampaignContributionSummary(
            @PathVariable Long campaignId,
            HttpServletRequest httpRequest) {

        Long userId = extractUserIdFromRequest(httpRequest);
        CampaignContributionSummaryResponse response = contributionService.getCampaignContributionSummary(campaignId, userId);
        return ResponseEntity.ok(response);
    }

    // POST /api/payments/notifications
    // MercadoPago llama este endpoint como webhook (IPN) - sin autenticacion
    @PostMapping("/notifications")
    public ResponseEntity<Void> handleWebhook(
            @RequestParam(required = false) String type,
            @RequestParam(value = "data.id", required = false) String dataId,
            @RequestBody(required = false) Map<String, Object> body) {

        // MercadoPago puede enviar el paymentId como query param o en el body
        String resolvedType = type;
        String resolvedId = dataId;

        if (body != null) {
            if (resolvedType == null) resolvedType = (String) body.get("type");
            if (resolvedId == null && body.get("data") instanceof Map) {
                resolvedId = String.valueOf(((Map<?, ?>) body.get("data")).get("id"));
            }
        }

        if (resolvedType != null && resolvedId != null) {
            try {
                contributionService.handleWebhook(resolvedType, Long.parseLong(resolvedId));
            } catch (Exception e) {
                logger.warn("Error procesando webhook type={} id={}: {}", resolvedType, resolvedId, e.getMessage());
            }
        }

        // Siempre responder 200 a MercadoPago para que no reintente
        return ResponseEntity.ok().build();
    }

    // Extrae el userId del cookie accessToken usando el JwtUtil
    private Long extractUserIdFromRequest(HttpServletRequest request) {
        String token = null;

        // Intentar leer del cookie
        if (request.getCookies() != null) {
            token = Arrays.stream(request.getCookies())
                    .filter(c -> "jwt".equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }

        // Fallback: leer del header Authorization: Bearer <token>
        if (token == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }

        if (token == null || !jwtUtil.validateToken(token)) {
            throw new SecurityException("Token de autenticacion invalido o ausente");
        }

        return jwtUtil.extractUserId(token);
    }
}

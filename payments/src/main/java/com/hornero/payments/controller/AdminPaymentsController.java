package com.hornero.payments.controller;

import com.hornero.payments.dto.AdminCampaignPaymentDetailResponse;
import com.hornero.payments.dto.AdminCampaignPaymentSummaryResponse;
import com.hornero.payments.service.AdminPaymentQueryService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/internal/payments")
public class AdminPaymentsController {

    private final AdminPaymentQueryService adminPaymentQueryService;

    @Value("${app.service-key}")
    private String serviceKey;

    public AdminPaymentsController(AdminPaymentQueryService adminPaymentQueryService) {
        this.adminPaymentQueryService = adminPaymentQueryService;
    }

    @PostMapping("/campaigns/summary")
    public ResponseEntity<List<AdminCampaignPaymentSummaryResponse>> getCampaignSummaries(
            @RequestBody Map<String, List<?>> body,
            @RequestHeader("X-Service-Key") String incomingKey) {

        validateServiceKey(incomingKey);
        return ResponseEntity.ok(adminPaymentQueryService.getCampaignSummaries(parseCampaignIds(body.get("campaignIds"))));
    }

    @GetMapping("/campaigns/{id}/detail")
    public ResponseEntity<AdminCampaignPaymentDetailResponse> getCampaignDetail(
            @PathVariable Long id,
            @RequestHeader("X-Service-Key") String incomingKey) {

        validateServiceKey(incomingKey);
        return ResponseEntity.ok(adminPaymentQueryService.getCampaignDetail(id));
    }

    private void validateServiceKey(String incomingKey) {
        if (!serviceKey.equals(incomingKey)) {
            throw new SecurityException("X-Service-Key inválida");
        }
    }

    private List<Long> parseCampaignIds(List<?> rawCampaignIds) {
        if (rawCampaignIds == null || rawCampaignIds.isEmpty()) {
            return List.of();
        }

        return rawCampaignIds.stream()
                .map(value -> {
                    if (!(value instanceof Number number)) {
                        throw new IllegalArgumentException("campaignIds debe contener solo números");
                    }
                    return number.longValue();
                })
                .toList();
    }
}

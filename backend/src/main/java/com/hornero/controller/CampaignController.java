package com.hornero.controller;

import com.hornero.model.Campaign;
import com.hornero.service.CampaignService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/campaigns")
@CrossOrigin(origins = "*")
public class CampaignController {

    @Autowired
    private CampaignService campaignService;

    @Value("${app.service-key:internal-secret-dev}")
    private String serviceKey;

    // GET /api/campaigns
    @GetMapping
    public List<Campaign> getAllCampaigns() {
        return campaignService.getAllCampaigns();
    }

    // GET /api/campaigns/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Campaign> getCampaignById(@PathVariable Long id) {
        return campaignService.getCampaignById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/campaigns
    @PostMapping
    public ResponseEntity<Campaign> createCampaign(@RequestBody Campaign campaign) {
        Campaign newCampaign = campaignService.createCampaign(campaign);
        return ResponseEntity.status(HttpStatus.CREATED).body(newCampaign);
    }

    // PUT /api/campaigns/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Campaign> updateCampaign(@PathVariable Long id, @RequestBody Campaign campaignDetails) {
        try {
            Campaign updated = campaignService.updateCampaign(id, campaignDetails);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // PATCH /api/campaigns/{id}/current-amount
    // Llamado internamente por el payments service cuando una contribucion es aprobada
    @PatchMapping("/{id}/current-amount")
    public ResponseEntity<Void> addToCurrentAmount(
            @PathVariable Long id,
            @RequestBody Map<String, BigDecimal> body,
            @RequestHeader("X-Service-Key") String incomingKey) {

        if (!serviceKey.equals(incomingKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        BigDecimal amount = body.get("amount");
        if (amount == null) {
            return ResponseEntity.badRequest().build();
        }

        campaignService.addToCampaignAmount(id, amount);
        return ResponseEntity.ok().build();
    }

    // DELETE /api/campaigns/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampaign(@PathVariable Long id) {
        try {
            campaignService.deleteCampaign(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

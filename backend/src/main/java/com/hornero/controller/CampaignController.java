package com.hornero.controller;

import com.hornero.model.Campaign;
import com.hornero.service.CampaignService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@CrossOrigin(origins = "*")
public class CampaignController {

    @Autowired
    private CampaignService campaignService;

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

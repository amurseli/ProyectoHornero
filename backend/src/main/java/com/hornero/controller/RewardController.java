package com.hornero.controller;

import com.hornero.model.Campaign;
import com.hornero.model.Reward;
import com.hornero.repository.CampaignRepository;
import com.hornero.repository.RewardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns/{campaignId}/rewards")
@CrossOrigin(origins = "*")
public class RewardController {

    @Autowired
    private RewardRepository rewardRepository;

    @Autowired
    private CampaignRepository campaignRepository;

    @GetMapping
    public ResponseEntity<List<Reward>> getRewards(@PathVariable Long campaignId) {
        return ResponseEntity.ok(rewardRepository.findByCampaignIdOrderByDisplayOrderAsc(campaignId));
    }

    @PostMapping
    public ResponseEntity<Reward> createReward(@PathVariable Long campaignId, @RequestBody Reward reward) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));
        reward.setCampaign(campaign);
        return ResponseEntity.status(HttpStatus.CREATED).body(rewardRepository.save(reward));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Reward> updateReward(@PathVariable Long campaignId, @PathVariable Long id, @RequestBody Reward details) {
        Reward existing = rewardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reward no encontrada"));
        existing.setTitle(details.getTitle());
        existing.setDescription(details.getDescription());
        existing.setPrice(details.getPrice());
        existing.setDisplayOrder(details.getDisplayOrder());
        return ResponseEntity.ok(rewardRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReward(@PathVariable Long campaignId, @PathVariable Long id) {
        rewardRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
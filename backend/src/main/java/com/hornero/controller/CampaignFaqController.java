package com.hornero.controller;

import com.hornero.model.Campaign;
import com.hornero.model.CampaignFaq;
import com.hornero.repository.CampaignRepository;
import com.hornero.repository.CampaignFaqRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns/{campaignId}/faqs")
@CrossOrigin(origins = "*")
public class CampaignFaqController {

    @Autowired
    private CampaignFaqRepository faqRepository;

    @Autowired
    private CampaignRepository campaignRepository;

    @GetMapping
    public ResponseEntity<List<CampaignFaq>> getFaqs(@PathVariable Long campaignId) {
        return ResponseEntity.ok(faqRepository.findByCampaignIdOrderByDisplayOrderAsc(campaignId));
    }

    @PostMapping
    public ResponseEntity<CampaignFaq> createFaq(@PathVariable Long campaignId, @RequestBody CampaignFaq faq) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));
        faq.setCampaign(campaign);
        return ResponseEntity.status(HttpStatus.CREATED).body(faqRepository.save(faq));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CampaignFaq> updateFaq(@PathVariable Long campaignId, @PathVariable Long id, @RequestBody CampaignFaq details) {
        CampaignFaq existing = faqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ no encontrada"));
        existing.setQuestion(details.getQuestion());
        existing.setAnswer(details.getAnswer());
        existing.setDisplayOrder(details.getDisplayOrder());
        return ResponseEntity.ok(faqRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFaq(@PathVariable Long campaignId, @PathVariable Long id) {
        faqRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
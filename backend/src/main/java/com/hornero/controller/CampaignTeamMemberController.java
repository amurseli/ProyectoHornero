package com.hornero.controller;

import com.hornero.model.Campaign;
import com.hornero.model.CampaignTeamMember;
import com.hornero.repository.CampaignRepository;
import com.hornero.repository.CampaignTeamMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns/{campaignId}/team")
@CrossOrigin(origins = "*")
public class CampaignTeamMemberController {

    @Autowired
    private CampaignTeamMemberRepository teamRepository;

    @Autowired
    private CampaignRepository campaignRepository;

    @GetMapping
    public ResponseEntity<List<CampaignTeamMember>> getTeam(@PathVariable Long campaignId) {
        return ResponseEntity.ok(teamRepository.findByCampaignIdOrderByDisplayOrderAsc(campaignId));
    }

    @PostMapping
    public ResponseEntity<CampaignTeamMember> createMember(@PathVariable Long campaignId,
                                                           @RequestBody CampaignTeamMember member) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));
        member.setCampaign(campaign);
        return ResponseEntity.status(HttpStatus.CREATED).body(teamRepository.save(member));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CampaignTeamMember> updateMember(@PathVariable Long campaignId,
                                                           @PathVariable Long id,
                                                           @RequestBody CampaignTeamMember details) {
        CampaignTeamMember existing = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Miembro no encontrado"));
        existing.setName(details.getName());
        existing.setRole(details.getRole());
        existing.setBio(details.getBio());
        existing.setImageBase64(details.getImageBase64());
        existing.setDisplayOrder(details.getDisplayOrder());
        return ResponseEntity.ok(teamRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMember(@PathVariable Long campaignId, @PathVariable Long id) {
        teamRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

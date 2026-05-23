package com.hornero.controller;

import com.hornero.model.Campaign;
import com.hornero.model.CampaignTeamMember;
import com.hornero.repository.CampaignRepository;
import com.hornero.repository.CampaignTeamMemberRepository;
import com.hornero.service.AppImageService;
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

    @Autowired
    private AppImageService appImageService;

    @GetMapping
    public ResponseEntity<List<CampaignTeamMember>> getTeam(@PathVariable Long campaignId) {
        List<CampaignTeamMember> team = teamRepository.findByCampaignIdOrderByDisplayOrderAsc(campaignId);
        appImageService.hydrateTeamMembers(team);
        return ResponseEntity.ok(team);
    }

    @PostMapping
    public ResponseEntity<CampaignTeamMember> createMember(@PathVariable Long campaignId,
                                                           @RequestBody CampaignTeamMember member) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));
        member.setCampaign(campaign);
        String s3Key = normalizeMemberImage(campaignId, member.getImageBase64(), member.getImageS3Key());
        member.setImageS3Key(s3Key);
        member.setImageBase64(null);
        CampaignTeamMember saved = teamRepository.save(member);
        appImageService.hydrateTeamMember(saved);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CampaignTeamMember> updateMember(@PathVariable Long campaignId,
                                                           @PathVariable Long id,
                                                           @RequestBody CampaignTeamMember details) {
        CampaignTeamMember existing = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Miembro no encontrado"));
        String previousKey = existing.getImageS3Key();
        existing.setName(details.getName());
        existing.setRole(details.getRole());
        existing.setBio(details.getBio());
        String nextKey = normalizeMemberImage(campaignId, details.getImageBase64(), details.getImageS3Key());
        existing.setImageS3Key(nextKey);
        existing.setImageBase64(null);
        existing.setDisplayOrder(details.getDisplayOrder());
        CampaignTeamMember saved = teamRepository.save(existing);
        if (previousKey != null && !previousKey.isBlank() && (nextKey == null || !previousKey.equals(nextKey))) {
            appImageService.deleteImage(previousKey);
        }
        appImageService.hydrateTeamMember(saved);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMember(@PathVariable Long campaignId, @PathVariable Long id) {
        CampaignTeamMember member = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Miembro no encontrado"));
        String s3Key = member.getImageS3Key();
        teamRepository.deleteById(id);
        appImageService.deleteImage(s3Key);
        return ResponseEntity.noContent().build();
    }

    private String normalizeMemberImage(Long campaignId, String imageBase64, String existingKey) {
        if (imageBase64 != null && !imageBase64.isBlank()) {
            return appImageService.persistBase64Image("equipo/campaign-" + campaignId, imageBase64);
        }
        return (existingKey != null && !existingKey.isBlank()) ? existingKey : null;
    }
}

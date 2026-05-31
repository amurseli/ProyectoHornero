package com.hornero.service;

import com.hornero.model.Campaign;
import com.hornero.model.SavedCampaign;
import com.hornero.model.User;
import com.hornero.repository.CampaignRepository;
import com.hornero.repository.SavedCampaignRepository;
import com.hornero.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SavedCampaignService {

    @Autowired
    private SavedCampaignRepository savedCampaignRepository;

    @Autowired
    private CampaignRepository campaignRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppImageService appImageService;

    @Transactional
    public void saveCampaign(Long userId, Long campaignId) {
        if (savedCampaignRepository.existsByUserIdAndCampaignId(userId, campaignId)) {
            return;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

        SavedCampaign savedCampaign = new SavedCampaign();
        savedCampaign.setUser(user);
        savedCampaign.setCampaign(campaign);
        savedCampaignRepository.save(savedCampaign);
    }

    @Transactional
    public void unsaveCampaign(Long userId, Long campaignId) {
        savedCampaignRepository.deleteByUserIdAndCampaignId(userId, campaignId);
    }

    @Transactional(readOnly = true)
    public boolean isCampaignSaved(Long userId, Long campaignId) {
        return savedCampaignRepository.existsByUserIdAndCampaignId(userId, campaignId);
    }

    @Transactional(readOnly = true)
    public List<Campaign> getSavedCampaigns(Long userId) {
        List<Campaign> campaigns = savedCampaignRepository.findAllByUserIdWithCampaignRelations(userId).stream()
                .map(SavedCampaign::getCampaign)
                .toList();
        appImageService.hydrateCampaigns(campaigns);
        return campaigns;
    }
}

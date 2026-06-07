package com.hornero.service;

import com.hornero.model.Campaign;
import com.hornero.model.SavedCampaign;
import com.hornero.model.User;
import com.hornero.repository.CampaignRepository;
import com.hornero.repository.SavedCampaignRepository;
import com.hornero.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SavedCampaignServiceTest {

    @Mock SavedCampaignRepository savedCampaignRepository;
    @Mock CampaignRepository campaignRepository;
    @Mock UserRepository userRepository;
    @Mock AppImageService appImageService;

    @InjectMocks SavedCampaignService service;

    @Test
    void saveCampaign_whenAlreadySaved_doesNothing() {
        when(savedCampaignRepository.existsByUserIdAndCampaignId(1L, 2L)).thenReturn(true);

        service.saveCampaign(1L, 2L);

        verify(savedCampaignRepository, never()).save(any());
        verifyNoInteractions(userRepository, campaignRepository);
    }

    @Test
    void saveCampaign_whenUserNotFound_throws() {
        when(savedCampaignRepository.existsByUserIdAndCampaignId(1L, 2L)).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.saveCampaign(1L, 2L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Usuario");

        verify(savedCampaignRepository, never()).save(any());
    }

    @Test
    void saveCampaign_whenCampaignNotFound_throws() {
        when(savedCampaignRepository.existsByUserIdAndCampaignId(1L, 2L)).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(new User()));
        when(campaignRepository.findById(2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.saveCampaign(1L, 2L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Campaña");

        verify(savedCampaignRepository, never()).save(any());
    }

    @Test
    void saveCampaign_whenValid_persistsSavedCampaignWithUserAndCampaign() {
        User user = new User();
        Campaign campaign = new Campaign();
        when(savedCampaignRepository.existsByUserIdAndCampaignId(1L, 2L)).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(campaignRepository.findById(2L)).thenReturn(Optional.of(campaign));

        service.saveCampaign(1L, 2L);

        verify(savedCampaignRepository).save(argThat(sc ->
                sc.getCampaign() == campaign));
    }

    @Test
    void unsaveCampaign_delegatesToRepository() {
        service.unsaveCampaign(1L, 2L);

        verify(savedCampaignRepository).deleteByUserIdAndCampaignId(1L, 2L);
    }

    @Test
    void isCampaignSaved_returnsRepositoryResult() {
        when(savedCampaignRepository.existsByUserIdAndCampaignId(1L, 2L)).thenReturn(true);

        assertThat(service.isCampaignSaved(1L, 2L)).isTrue();
    }

    @Test
    void getSavedCampaigns_mapsCampaignsAndHydratesImages() {
        Campaign campaign = new Campaign();
        SavedCampaign saved = new SavedCampaign();
        saved.setCampaign(campaign);
        when(savedCampaignRepository.findAllByUserIdWithCampaignRelations(1L))
                .thenReturn(List.of(saved));

        List<Campaign> result = service.getSavedCampaigns(1L);

        assertThat(result).containsExactly(campaign);
        verify(appImageService).hydrateCampaigns(argThat(list -> list.contains(campaign)));
    }
}

package com.hornero.service;

import com.hornero.model.Campaign;
import com.hornero.model.User;
import com.hornero.repository.CampaignRepository;
import com.hornero.service.validator.CampaignPublishValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CampaignServiceTest {

    @Mock CampaignRepository campaignRepository;
    @Mock AppImageService appImageService;
    @Mock CampaignPublishValidator publishValidator;

    @InjectMocks CampaignService service;

    @BeforeEach
    void setUp() {
        // publishValidators is a List injected by type; wire it explicitly.
        ReflectionTestUtils.setField(service, "publishValidators", List.of(publishValidator));
    }

    private Campaign draftOwnedBy(Long ownerId) {
        User owner = new User();
        owner.setId(ownerId);
        Campaign campaign = new Campaign();
        campaign.setOwner(owner);
        campaign.setStatus("DRAFT");
        return campaign;
    }

    // --- slugify ---

    @Test
    void slugify_stripsAccentsLowercasesAndHyphenates() {
        assertThat(CampaignService.slugify("Educación Rural 2026")).isEqualTo("educacion-rural-2026");
        assertThat(CampaignService.slugify("  ¡Hola, Mundo!  ")).isEqualTo("hola-mundo");
        assertThat(CampaignService.slugify(null)).isEmpty();
    }

    // --- finalizeCampaign ---

    @Test
    void finalizeCampaign_whenGoalReached_marksSuccessfulAndPayoutPending() {
        Campaign campaign = new Campaign();
        campaign.setStatus("CROWDFUNDING");
        campaign.setCurrentAmount(new BigDecimal("1000"));
        campaign.setTargetAmount(new BigDecimal("1000"));

        boolean finalized = service.finalizeCampaign(campaign);

        assertThat(finalized).isTrue();
        assertThat(campaign.getStatus()).isEqualTo("SUCCESSFUL");
        assertThat(campaign.getMoneyStatus()).isEqualTo("PAYOUT_PENDING");
        verify(campaignRepository).save(campaign);
    }

    @Test
    void finalizeCampaign_whenGoalNotReached_marksFailedAndRefundPending() {
        Campaign campaign = new Campaign();
        campaign.setStatus("CROWDFUNDING");
        campaign.setCurrentAmount(new BigDecimal("500"));
        campaign.setTargetAmount(new BigDecimal("1000"));

        boolean finalized = service.finalizeCampaign(campaign);

        assertThat(finalized).isTrue();
        assertThat(campaign.getStatus()).isEqualTo("FAILED");
        assertThat(campaign.getMoneyStatus()).isEqualTo("REFUND_PENDING");
        verify(campaignRepository).save(campaign);
    }

    @Test
    void finalizeCampaign_whenNotCrowdfunding_returnsFalseWithoutSaving() {
        Campaign campaign = new Campaign();
        campaign.setStatus("DRAFT");

        boolean finalized = service.finalizeCampaign(campaign);

        assertThat(finalized).isFalse();
        verify(campaignRepository, never()).save(any());
    }

    // --- publishCampaign ---

    @Test
    void publishCampaign_whenNotFound_throwsRuntime() {
        when(campaignRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.publishCampaign(1L, 1L, "USER"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("no encontrada");
    }

    @Test
    void publishCampaign_whenNotOwnerNorAdmin_throwsSecurity() {
        when(campaignRepository.findById(1L)).thenReturn(Optional.of(draftOwnedBy(1L)));

        assertThatThrownBy(() -> service.publishCampaign(1L, 999L, "USER"))
                .isInstanceOf(SecurityException.class);

        verify(publishValidator, never()).validate(any());
    }

    @Test
    void publishCampaign_whenNotDraft_throwsIllegalState() {
        Campaign campaign = draftOwnedBy(1L);
        campaign.setStatus("CROWDFUNDING");
        when(campaignRepository.findById(1L)).thenReturn(Optional.of(campaign));

        assertThatThrownBy(() -> service.publishCampaign(1L, 1L, "USER"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DRAFT");
    }

    @Test
    void publishCampaign_whenValidOwner_runsValidatorsAndSetsCrowdfunding() {
        Campaign campaign = draftOwnedBy(1L);
        when(campaignRepository.findById(1L)).thenReturn(Optional.of(campaign));
        when(campaignRepository.save(campaign)).thenReturn(campaign);

        Campaign result = service.publishCampaign(1L, 1L, "USER");

        verify(publishValidator).validate(campaign);
        assertThat(result.getStatus()).isEqualTo("CROWDFUNDING");
        verify(campaignRepository).save(campaign);
        verify(appImageService).hydrateCampaign(campaign);
    }

    @Test
    void publishCampaign_allowsAdminEvenIfNotOwner() {
        Campaign campaign = draftOwnedBy(1L);
        when(campaignRepository.findById(1L)).thenReturn(Optional.of(campaign));
        when(campaignRepository.save(campaign)).thenReturn(campaign);

        Campaign result = service.publishCampaign(1L, 999L, "ADMIN");

        assertThat(result.getStatus()).isEqualTo("CROWDFUNDING");
    }

    // --- updateCampaign ---

    @Test
    void updateCampaign_whenNotOwnerNorAdmin_throwsSecurity() {
        when(campaignRepository.findById(1L)).thenReturn(Optional.of(draftOwnedBy(1L)));

        assertThatThrownBy(() -> service.updateCampaign(1L, new Campaign(), 999L, "USER"))
                .isInstanceOf(SecurityException.class);

        verify(campaignRepository, never()).save(any());
    }

    @Test
    void updateCampaign_whenDraftOwner_updatesEditableFields() {
        Campaign existing = draftOwnedBy(1L);
        when(campaignRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(campaignRepository.save(existing)).thenReturn(existing);

        Campaign details = new Campaign();
        details.setTitle("Nuevo título");
        details.setTargetAmount(new BigDecimal("7777"));

        Campaign result = service.updateCampaign(1L, details, 1L, "USER");

        assertThat(result.getTitle()).isEqualTo("Nuevo título");
        assertThat(result.getTargetAmount()).isEqualByComparingTo("7777");
        verify(campaignRepository).save(existing);
    }

    // --- addToCampaignAmount ---

    @Test
    void addToCampaignAmount_addsToCurrentAmountAndSaves() {
        Campaign campaign = new Campaign();
        campaign.setCurrentAmount(new BigDecimal("100"));
        when(campaignRepository.findById(1L)).thenReturn(Optional.of(campaign));

        service.addToCampaignAmount(1L, new BigDecimal("250"));

        assertThat(campaign.getCurrentAmount()).isEqualByComparingTo("350");
        verify(campaignRepository).save(campaign);
    }

    @Test
    void addToCampaignAmount_whenCampaignMissing_throws() {
        when(campaignRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addToCampaignAmount(1L, BigDecimal.TEN))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("1");
    }

    // --- getCampaignBySlug ---

    @Test
    void getCampaignBySlug_withBlankArguments_returnsEmpty() {
        assertThat(service.getCampaignBySlug(null, "slug")).isEmpty();
        assertThat(service.getCampaignBySlug("user", "  ")).isEmpty();
        verifyNoInteractions(campaignRepository);
    }

    // --- getPublicCampaignsPaged ---

    @Test
    void getPublicCampaignsPaged_whenNoIds_returnsEmptyPageWithoutLoadingRelations() {
        Pageable pageable = PageRequest.of(0, 10);
        when(campaignRepository.findPublicIdsPaged(isNull(), isNull(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        Page<Campaign> result = service.getPublicCampaignsPaged("   ", null, pageable);

        assertThat(result.getContent()).isEmpty();
        verify(campaignRepository, never()).findAllByIdsWithRelations(any());
    }
}

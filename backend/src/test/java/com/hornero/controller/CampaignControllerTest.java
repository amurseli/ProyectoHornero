package com.hornero.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hornero.model.Campaign;
import com.hornero.model.User;
import com.hornero.service.CampaignService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CampaignControllerTest {

    private static final String KEY = "test-service-key";

    private CampaignService campaignService;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        campaignService = mock(CampaignService.class);
        CampaignController controller = new CampaignController();
        ReflectionTestUtils.setField(controller, "campaignService", campaignService);
        ReflectionTestUtils.setField(controller, "serviceKey", KEY);

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    private Campaign campaign(String status) {
        Campaign c = new Campaign();
        c.setStatus(status);
        return c;
    }

    // --- publishCampaign ---

    @Test
    void publishCampaign_withoutUserId_returns401() throws Exception {
        mockMvc.perform(post("/api/campaigns/1/publish"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(campaignService);
    }

    @Test
    void publishCampaign_whenSecurityException_returns403() throws Exception {
        when(campaignService.publishCampaign(1L, 9L, "USER"))
                .thenThrow(new SecurityException("No tenés permiso"));

        mockMvc.perform(post("/api/campaigns/1/publish")
                        .requestAttr("userId", 9L)
                        .requestAttr("userRole", "USER"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void publishCampaign_whenIllegalState_returns422() throws Exception {
        when(campaignService.publishCampaign(1L, 9L, "USER"))
                .thenThrow(new IllegalStateException("Solo se pueden publicar campañas en estado DRAFT"));

        mockMvc.perform(post("/api/campaigns/1/publish")
                        .requestAttr("userId", 9L)
                        .requestAttr("userRole", "USER"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void publishCampaign_whenNotFound_returns404() throws Exception {
        when(campaignService.publishCampaign(1L, 9L, "USER"))
                .thenThrow(new RuntimeException("Campaña no encontrada"));

        mockMvc.perform(post("/api/campaigns/1/publish")
                        .requestAttr("userId", 9L)
                        .requestAttr("userRole", "USER"))
                .andExpect(status().isNotFound());
    }

    @Test
    void publishCampaign_whenValid_returns200() throws Exception {
        when(campaignService.publishCampaign(1L, 9L, "USER")).thenReturn(campaign("CROWDFUNDING"));

        mockMvc.perform(post("/api/campaigns/1/publish")
                        .requestAttr("userId", 9L)
                        .requestAttr("userRole", "USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CROWDFUNDING"));
    }

    // --- updateCampaign ---

    @Test
    void updateCampaign_withoutUserId_returns401() throws Exception {
        mockMvc.perform(put("/api/campaigns/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateCampaign_whenSecurityException_returns403() throws Exception {
        when(campaignService.updateCampaign(eq(1L), any(), eq(9L), eq("USER")))
                .thenThrow(new SecurityException("No tenés permiso"));

        mockMvc.perform(put("/api/campaigns/1")
                        .requestAttr("userId", 9L)
                        .requestAttr("userRole", "USER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    // --- addToCurrentAmount (internal, service-key protected) ---

    @Test
    void addToCurrentAmount_withWrongServiceKey_returns403() throws Exception {
        mockMvc.perform(patch("/api/campaigns/1/current-amount")
                        .header("X-Service-Key", "wrong")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("amount", 100))))
                .andExpect(status().isForbidden());

        verifyNoInteractions(campaignService);
    }

    @Test
    void addToCurrentAmount_withoutAmount_returns400() throws Exception {
        mockMvc.perform(patch("/api/campaigns/1/current-amount")
                        .header("X-Service-Key", KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(campaignService);
    }

    @Test
    void addToCurrentAmount_withValidKeyAndAmount_returns200AndDelegates() throws Exception {
        mockMvc.perform(patch("/api/campaigns/1/current-amount")
                        .header("X-Service-Key", KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("amount", 250))))
                .andExpect(status().isOk());

        verify(campaignService).addToCampaignAmount(eq(1L), eq(new BigDecimal("250")));
    }

    // --- updateMoneyStatus (internal) ---

    @Test
    void updateMoneyStatus_withBlankStatus_returns400() throws Exception {
        mockMvc.perform(patch("/api/campaigns/1/money-status")
                        .header("X-Service-Key", KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("moneyStatus", "  "))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateMoneyStatus_whenServiceThrows_returns404() throws Exception {
        doThrow(new RuntimeException("Campaña no encontrada"))
                .when(campaignService).updateMoneyStatus(1L, "PAYOUT_COMPLETED");

        mockMvc.perform(patch("/api/campaigns/1/money-status")
                        .header("X-Service-Key", KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("moneyStatus", "PAYOUT_COMPLETED"))))
                .andExpect(status().isNotFound());
    }

    // --- getCampaignById (visibility rules) ---

    @Test
    void getCampaignById_whenMissing_returns404() throws Exception {
        when(campaignService.getCampaignById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/campaigns/1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getCampaignById_whenPublicStatus_returns200WithoutKey() throws Exception {
        when(campaignService.getCampaignById(1L)).thenReturn(Optional.of(campaign("CROWDFUNDING")));

        mockMvc.perform(get("/api/campaigns/1"))
                .andExpect(status().isOk());
    }

    @Test
    void getCampaignById_whenDraftAndNotOwner_returns404() throws Exception {
        when(campaignService.getCampaignById(1L)).thenReturn(Optional.of(campaign("DRAFT")));

        mockMvc.perform(get("/api/campaigns/1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getCampaignById_whenDraftAndOwner_returns200() throws Exception {
        Campaign draft = campaign("DRAFT");
        User owner = new User();
        owner.setId(9L);
        draft.setOwner(owner);
        when(campaignService.getCampaignById(1L)).thenReturn(Optional.of(draft));

        mockMvc.perform(get("/api/campaigns/1").requestAttr("userId", 9L))
                .andExpect(status().isOk());
    }

    @Test
    void getCampaignById_whenServiceKeyMatches_returns200EvenForDraft() throws Exception {
        when(campaignService.getCampaignById(1L)).thenReturn(Optional.of(campaign("DRAFT")));

        mockMvc.perform(get("/api/campaigns/1").header("X-Service-Key", KEY))
                .andExpect(status().isOk());
    }

    // --- deleteCampaign ---

    @Test
    void deleteCampaign_withoutUserId_returns401() throws Exception {
        mockMvc.perform(delete("/api/campaigns/1"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(campaignService);
    }

    @Test
    void deleteCampaign_whenSuccessful_returns204() throws Exception {
        mockMvc.perform(delete("/api/campaigns/1")
                        .requestAttr("userId", 9L)
                        .requestAttr("userRole", "USER"))
                .andExpect(status().isNoContent());

        verify(campaignService).deleteCampaignAsUser(1L, 9L, "USER");
    }

    @Test
    void deleteCampaign_whenNotOwner_returns403() throws Exception {
        doThrow(new SecurityException("No tenés permiso para eliminar esta campaña"))
                .when(campaignService).deleteCampaignAsUser(1L, 9L, "USER");

        mockMvc.perform(delete("/api/campaigns/1")
                        .requestAttr("userId", 9L)
                        .requestAttr("userRole", "USER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteCampaign_whenServiceThrows_returns404() throws Exception {
        doThrow(new RuntimeException("Campaña no encontrada"))
                .when(campaignService).deleteCampaignAsUser(1L, 9L, "USER");

        mockMvc.perform(delete("/api/campaigns/1")
                        .requestAttr("userId", 9L)
                        .requestAttr("userRole", "USER"))
                .andExpect(status().isNotFound());
    }

    // --- createCampaign ---

    @Test
    void createCampaign_withoutUserId_returns401() throws Exception {
        mockMvc.perform(post("/api/campaigns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(campaignService);
    }

    @Test
    void createCampaign_withUserId_delegatesWithRequestingUserId() throws Exception {
        Campaign created = campaign("DRAFT");
        ReflectionTestUtils.setField(created, "id", 42L);
        when(campaignService.createCampaignForUser(any(), eq(9L))).thenReturn(created);

        mockMvc.perform(post("/api/campaigns")
                        .requestAttr("userId", 9L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(42));

        verify(campaignService).createCampaignForUser(any(), eq(9L));
    }
}

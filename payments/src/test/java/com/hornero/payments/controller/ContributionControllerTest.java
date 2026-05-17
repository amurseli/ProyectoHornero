package com.hornero.payments.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hornero.payments.dto.InitiateContributionResponse;
import com.hornero.payments.service.ContributionService;
import com.hornero.payments.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ContributionController.class)
class ContributionControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean ContributionService contributionService;
    @MockBean JwtUtil jwtUtil;

    @Test
    void initiate_withoutToken_returns403() throws Exception {
        mockMvc.perform(post("/api/payments/contributions/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("campaignId", 1, "amount", 100))))
                .andExpect(status().isForbidden());

        verifyNoInteractions(contributionService);
    }

    @Test
    void initiate_withValidJwtInCookie_callsServiceAndReturns201() throws Exception {
        when(jwtUtil.validateToken("test-token")).thenReturn(true);
        when(jwtUtil.extractUserId("test-token")).thenReturn(1L);
        when(contributionService.initiate(eq(5L), eq(1L), any()))
                .thenReturn(new InitiateContributionResponse(42L, "TEST-key", new BigDecimal("100"), "ARS"));

        mockMvc.perform(post("/api/payments/contributions/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("campaignId", 5, "amount", 100)))
                        .cookie(new jakarta.servlet.http.Cookie("jwt", "test-token")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contributionId").value(42));
    }

    @Test
    void initiate_withValidJwtInAuthorizationHeader_callsServiceAndReturns201() throws Exception {
        when(jwtUtil.validateToken("header-token")).thenReturn(true);
        when(jwtUtil.extractUserId("header-token")).thenReturn(2L);
        when(contributionService.initiate(eq(5L), eq(2L), any()))
                .thenReturn(new InitiateContributionResponse(99L, "TEST-key", new BigDecimal("200"), "ARS"));

        mockMvc.perform(post("/api/payments/contributions/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("campaignId", 5, "amount", 200)))
                        .header("Authorization", "Bearer header-token"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contributionId").value(99));
    }

    @Test
    void webhook_alwaysReturns200EvenIfServiceThrows() throws Exception {
        doThrow(new RuntimeException("webhook processing error"))
                .when(contributionService).handleWebhook(any(), any());

        mockMvc.perform(post("/api/payments/notifications")
                        .param("type", "payment")
                        .param("data.id", "12345"))
                .andExpect(status().isOk());
    }
}

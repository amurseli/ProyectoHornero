package com.hornero.payments.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hornero.payments.dto.InitiateContributionResponse;
import com.hornero.payments.dto.ProcessContributionRequest;
import com.hornero.payments.service.ContributionService;
import com.hornero.payments.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ContributionController.class)
@Import(ContributionControllerTest.Config.class)
class ContributionControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired StubContributionService contributionService;

    @org.springframework.boot.test.mock.mockito.MockBean JwtUtil jwtUtil;

    @TestConfiguration
    static class Config {
        @Bean
        StubContributionService contributionService() {
            return new StubContributionService();
        }
    }

    static class StubContributionService extends ContributionService {
        private InitiateContributionResponse initiateResponse;
        private RuntimeException webhookException;
        private boolean webhookCalled;

        StubContributionService() {
            super(null, null, null, null, null, null);
        }

        @Override
        public InitiateContributionResponse initiate(Long campaignId, Long userId, BigDecimal amount, Long rewardId) {
            return initiateResponse;
        }

        @Override
        public com.hornero.payments.dto.ContributionStatusResponse process(Long contributionId, Long userId, ProcessContributionRequest req) {
            throw new UnsupportedOperationException();
        }

        @Override
        public void handleWebhook(String type, Long paymentId) {
            webhookCalled = true;
            if (webhookException != null) throw webhookException;
        }
    }

    @Test
    void initiate_withoutToken_returns403() throws Exception {
        mockMvc.perform(post("/api/payments/contributions/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("campaignId", 1, "amount", 100))))
                .andExpect(status().isForbidden());
    }

    @Test
    void initiate_withValidJwtInCookie_callsServiceAndReturns201() throws Exception {
        when(jwtUtil.validateToken("test-token")).thenReturn(true);
        when(jwtUtil.extractUserId("test-token")).thenReturn(1L);
        contributionService.initiateResponse = new InitiateContributionResponse(42L, "TEST-key", new BigDecimal("100"), "ARS", null, "PENDING");

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
        contributionService.initiateResponse = new InitiateContributionResponse(99L, "TEST-key", new BigDecimal("200"), "ARS", null, "PENDING");

        mockMvc.perform(post("/api/payments/contributions/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("campaignId", 5, "amount", 200)))
                        .header("Authorization", "Bearer header-token"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contributionId").value(99));
    }

    @Test
    void webhook_alwaysReturns200EvenIfServiceThrows() throws Exception {
        contributionService.webhookException = new RuntimeException("webhook processing error");

        mockMvc.perform(post("/api/payments/notifications")
                        .param("type", "payment")
                        .param("data.id", "12345"))
                .andExpect(status().isOk());
        org.assertj.core.api.Assertions.assertThat(contributionService.webhookCalled).isTrue();
    }
}

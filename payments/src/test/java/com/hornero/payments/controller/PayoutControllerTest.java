package com.hornero.payments.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hornero.payments.service.PayoutService;
import com.hornero.payments.service.RefundService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PayoutController.class)
class PayoutControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean PayoutService payoutService;
    @MockBean RefundService refundService;

    @Test
    void executePayout_withWrongServiceKey_returns403() throws Exception {
        mockMvc.perform(post("/api/payments/campaigns/1/payout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("creatorUserId", 10)))
                        .header("X-Service-Key", "wrong-key"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(payoutService);
    }

    @Test
    void executePayout_withMissingCreatorUserId_returns400() throws Exception {
        mockMvc.perform(post("/api/payments/campaigns/1/payout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of()))
                        .header("X-Service-Key", "test-service-key"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());

        verifyNoInteractions(payoutService);
    }

    @Test
    void refundAll_withInvalidReason_returns400() throws Exception {
        mockMvc.perform(post("/api/payments/campaigns/1/refund-all")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "INVALID_REASON")))
                        .header("X-Service-Key", "test-service-key"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());

        verifyNoInteractions(refundService);
    }
}

package com.hornero.blockchain.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hornero.blockchain.service.LedgerRegistrationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class LedgerControllerTest {

    private LedgerRegistrationService service;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        service = mock(LedgerRegistrationService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new LedgerController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    private String body(Object emisor, Object receptor, Object amount, Object reference) throws Exception {
        var map = new java.util.HashMap<String, Object>();
        map.put("emisor", emisor);
        map.put("receptor", receptor);
        map.put("amount", amount);
        map.put("reference", reference);
        return objectMapper.writeValueAsString(map);
    }

    @Test
    void register_withValidRequest_returns201AndResponseBody() throws Exception {
        when(service.register(any())).thenReturn(
                new RegisterTransactionResponse(true, "0xabc", "0xcontract",
                        "https://amoy.polygonscan.com/tx/0xabc"));

        mockMvc.perform(post("/api/v1/transactions")
                        .contentType("application/json")
                        .content(body("mateo", "leticia", 1000, "ref-1")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.txHash").value("0xabc"))
                .andExpect(jsonPath("$.explorerUrl").value("https://amoy.polygonscan.com/tx/0xabc"));
    }

    @Test
    void register_acceptsReferenciaJsonAlias() throws Exception {
        when(service.register(any())).thenReturn(
                new RegisterTransactionResponse(true, "0xabc", "0xcontract", "url"));

        mockMvc.perform(post("/api/v1/transactions")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "emisor", "mateo",
                                "receptor", "leticia",
                                "amount", 1000,
                                "referencia", "ref-1"))))
                .andExpect(status().isCreated());
    }

    @Test
    void register_withBlankEmisor_returns400AndDoesNotCallService() throws Exception {
        mockMvc.perform(post("/api/v1/transactions")
                        .contentType("application/json")
                        .content(body("", "leticia", 1000, "ref-1")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.ok").value(false))
                .andExpect(jsonPath("$.error").exists());

        verifyNoInteractions(service);
    }

    @Test
    void register_withNonPositiveAmount_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/transactions")
                        .contentType("application/json")
                        .content(body("mateo", "leticia", -5, "ref-1")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());

        verifyNoInteractions(service);
    }

    @Test
    void register_whenServiceThrowsIllegalState_returns400() throws Exception {
        when(service.register(any()))
                .thenThrow(new IllegalStateException("Could not register transaction on Polygon"));

        mockMvc.perform(post("/api/v1/transactions")
                        .contentType("application/json")
                        .content(body("mateo", "leticia", 1000, "ref-1")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Could not register transaction on Polygon"));
    }

    @Test
    void register_whenServiceThrowsUnexpected_returns500() throws Exception {
        when(service.register(any())).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(post("/api/v1/transactions")
                        .contentType("application/json")
                        .content(body("mateo", "leticia", 1000, "ref-1")))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.ok").value(false));
    }
}

package com.hornero.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hornero.config.GlobalExceptionHandler;
import com.hornero.model.CreatorVerification;
import com.hornero.model.CreatorVerification.VerificationStatus;
import com.hornero.service.CreatorVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Standalone MockMvc tests for the REST layer. The controller reads identity from
 * request attributes (set by the JWT filter in production), so we inject them with
 * {@code requestAttr(...)} instead of loading the security infrastructure.
 */
class CreatorVerificationControllerTest {

    private CreatorVerificationService service;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        service = mock(CreatorVerificationService.class);
        CreatorVerificationController controller = new CreatorVerificationController();
        ReflectionTestUtils.setField(controller, "verificationService", service);

        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter(objectMapper);
        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(converter)
                .build();
    }

    private String validBody() throws Exception {
        return objectMapper.writeValueAsString(Map.ofEntries(
                Map.entry("fullLegalName", "Mateo Fernández"),
                Map.entry("dniNumber", "12345678"),
                Map.entry("cuilNumber", "20123456789"),
                Map.entry("dateOfBirth", "1995-05-20"),
                Map.entry("phoneNumber", "1122334455"),
                Map.entry("addressStreet", "Av. Siempreviva 742"),
                Map.entry("addressCity", "CABA"),
                Map.entry("addressProvince", "Buenos Aires"),
                Map.entry("addressZipCode", "1000"),
                Map.entry("taxCondition", "MONOTRIBUTISTA"),
                Map.entry("accountType", "CBU"),
                Map.entry("accountNumber", "0123456789012345678901"),
                Map.entry("bankOrWalletName", "Banco Nación"),
                Map.entry("accountHolderName", "Mateo Fernández"),
                Map.entry("termsAccepted", true)));
    }

    @Test
    void submitVerification_withoutUserId_returns401() throws Exception {
        mockMvc.perform(post("/api/users/me/verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBody()))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(service);
    }

    @Test
    void submitVerification_withValidBodyAndUser_returns200WithStatus() throws Exception {
        CreatorVerification verification = new CreatorVerification();
        verification.setVerificationStatus(VerificationStatus.PENDING);
        when(service.submitVerification(eq(7L), any())).thenReturn(verification);

        mockMvc.perform(post("/api/users/me/verification")
                        .requestAttr("userId", 7L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void submitVerification_withInvalidBody_returns400() throws Exception {
        // Empty body fails @NotBlank/@NotNull bean validation.
        mockMvc.perform(post("/api/users/me/verification")
                        .requestAttr("userId", 7L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());

        verifyNoInteractions(service);
    }

    @Test
    void submitVerification_whenServiceRejects_returns400WithMessage() throws Exception {
        when(service.submitVerification(eq(7L), any()))
                .thenThrow(new RuntimeException("Ya tenés una solicitud de verificación pendiente"));

        mockMvc.perform(post("/api/users/me/verification")
                        .requestAttr("userId", 7L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBody()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Ya tenés una solicitud de verificación pendiente"));
    }

    @Test
    void getVerifications_asNonAdmin_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/verifications")
                        .requestAttr("userRole", "USER"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(service);
    }

    @Test
    void getVerifications_asAdmin_returns200() throws Exception {
        when(service.getVerificationsByStatus(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/verifications")
                        .requestAttr("userRole", "ADMIN"))
                .andExpect(status().isOk());

        verify(service).getVerificationsByStatus(isNull());
    }

    @Test
    void decideVerification_asNonAdmin_returns403() throws Exception {
        mockMvc.perform(post("/api/admin/verifications/1/decision")
                        .requestAttr("userRole", "USER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("decision", "APPROVED"))))
                .andExpect(status().isForbidden());

        verifyNoInteractions(service);
    }

    @Test
    void decideVerification_rejectedWithoutReason_returns400() throws Exception {
        mockMvc.perform(post("/api/admin/verifications/1/decision")
                        .requestAttr("userRole", "ADMIN")
                        .requestAttr("userEmail", "admin@hornero.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("decision", "REJECTED"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("razón")));

        verify(service, never()).rejectVerification(anyLong(), any(), any());
    }

    @Test
    void decideVerification_withUnknownDecision_returns400() throws Exception {
        mockMvc.perform(post("/api/admin/verifications/1/decision")
                        .requestAttr("userRole", "ADMIN")
                        .requestAttr("userEmail", "admin@hornero.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("decision", "MAYBE"))))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(service);
    }

    @Test
    void decideVerification_approved_returns200() throws Exception {
        CreatorVerification approved = new CreatorVerification();
        approved.setVerificationStatus(VerificationStatus.APPROVED);
        when(service.approveVerification(1L, "admin@hornero.com")).thenReturn(approved);

        mockMvc.perform(post("/api/admin/verifications/1/decision")
                        .requestAttr("userRole", "ADMIN")
                        .requestAttr("userEmail", "admin@hornero.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("decision", "APPROVED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }
}

package com.hornero.payments.service;

import com.hornero.payments.client.BackendClient;
import com.hornero.payments.dto.ContributionStatusResponse;
import com.hornero.payments.dto.InitiateContributionResponse;
import com.hornero.payments.dto.ProcessContributionRequest;
import com.hornero.payments.gateway.MercadoPagoGateway;
import com.hornero.payments.model.Contribution;
import com.hornero.payments.model.Transaction;
import com.hornero.payments.repository.ContributionRepository;
import com.hornero.payments.repository.TransactionRepository;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContributionServiceTest {

    @Mock ContributionRepository contributionRepository;
    @Mock TransactionRepository transactionRepository;
    @Mock BackendClient backendClient;
    @Mock MercadoPagoGateway mercadoPagoGateway;
    @Mock PaymentEventLogService paymentEventLogService;

    @InjectMocks ContributionService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "mpPublicKey", "TEST-public-key");
    }

    // --- initiate ---

    @Test
    void initiate_whenAmountIsNull_throwsIllegalArgument() {
        assertThatThrownBy(() -> service.initiate(1L, 1L, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("monto minimo");
    }

    @Test
    void initiate_whenAmountIsZero_throwsIllegalArgument() {
        assertThatThrownBy(() -> service.initiate(1L, 1L, BigDecimal.ZERO))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void initiate_validAmount_savesPendingContributionAndReturnsPublicKey() {
        when(contributionRepository.save(any())).thenAnswer(inv -> {
            Contribution c = inv.getArgument(0);
            ReflectionTestUtils.setField(c, "id", 42L);
            return c;
        });

        InitiateContributionResponse response = service.initiate(5L, 2L, new BigDecimal("500"));

        assertThat(response.getPublicKey()).isEqualTo("TEST-public-key");
        assertThat(response.getContributionId()).isEqualTo(42L);
        assertThat(response.getAmount()).isEqualByComparingTo("500");

        verify(contributionRepository).save(argThat(c ->
                "PENDING".equals(c.getStatus()) && c.getIdCampaign().equals(5L)
        ));
    }

    // --- process ---

    @Test
    void process_whenContributionNotFound_throwsIllegalArgument() {
        when(contributionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.process(99L, 1L, new ProcessContributionRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("99");
    }

    @Test
    void process_whenUserDoesNotOwnContribution_throwsSecurityException() {
        Contribution c = contributionWithStatus("PENDING", 1L);
        when(contributionRepository.findById(1L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.process(1L, 999L, new ProcessContributionRequest()))
                .isInstanceOf(SecurityException.class);
    }

    @Test
    void process_whenContributionAlreadyProcessed_throwsIllegalState() {
        Contribution c = contributionWithStatus("APPROVED", 1L);
        when(contributionRepository.findById(1L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.process(1L, 1L, new ProcessContributionRequest()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APPROVED");
    }

    @Test
    void process_whenMpReturnsApproved_updatesStatusAndCallsBackend() throws Exception {
        Contribution c = contributionWithStatus("PENDING", 1L);
        c.setAmount(new BigDecimal("200"));
        c.setIdCampaign(10L);
        when(contributionRepository.findById(1L)).thenReturn(Optional.of(c));

        Payment mockPayment = mock(Payment.class);
        when(mockPayment.getStatus()).thenReturn("approved");
        when(mockPayment.getId()).thenReturn(111L);
        when(mercadoPagoGateway.create(any(PaymentCreateRequest.class))).thenReturn(mockPayment);

        ContributionStatusResponse response = service.process(1L, 1L, buildRequest());

        assertThat(response.getStatus()).isEqualTo("APPROVED");
        verify(backendClient).updateCampaignAmount(eq(10L), eq(new BigDecimal("200")));
        verify(contributionRepository, atLeastOnce()).save(argThat(con -> "APPROVED".equals(con.getStatus())));
    }

    @Test
    void process_whenMpReturnsRejected_updatesStatusAndDoesNotCallBackend() throws Exception {
        Contribution c = contributionWithStatus("PENDING", 1L);
        c.setAmount(new BigDecimal("100"));
        c.setIdCampaign(10L);
        when(contributionRepository.findById(1L)).thenReturn(Optional.of(c));

        Payment mockPayment = mock(Payment.class);
        when(mockPayment.getStatus()).thenReturn("rejected");
        when(mockPayment.getId()).thenReturn(222L);
        when(mercadoPagoGateway.create(any())).thenReturn(mockPayment);

        ContributionStatusResponse response = service.process(1L, 1L, buildRequest());

        assertThat(response.getStatus()).isEqualTo("REJECTED");
        verify(backendClient, never()).updateCampaignAmount(any(), any());
    }

    @Test
    void process_whenMPApiExceptionThrown_setsRejectedAndRethrows() throws Exception {
        Contribution c = contributionWithStatus("PENDING", 1L);
        when(contributionRepository.findById(1L)).thenReturn(Optional.of(c));

        MPApiException apiEx = mock(MPApiException.class);
        when(apiEx.getStatusCode()).thenReturn(400);
        var apiResponse = mock(com.mercadopago.net.MPResponse.class);
        when(apiResponse.getContent()).thenReturn("bad request");
        when(apiEx.getApiResponse()).thenReturn(apiResponse);
        when(mercadoPagoGateway.create(any())).thenThrow(apiEx);

        assertThatThrownBy(() -> service.process(1L, 1L, buildRequest()))
                .isInstanceOf(RuntimeException.class);

        verify(contributionRepository, atLeastOnce()).save(argThat(con -> "REJECTED".equals(con.getStatus())));
    }

    @Test
    void process_whenMPExceptionThrown_setsRejectedAndRethrows() throws Exception {
        Contribution c = contributionWithStatus("PENDING", 1L);
        when(contributionRepository.findById(1L)).thenReturn(Optional.of(c));
        when(mercadoPagoGateway.create(any())).thenThrow(new MPException("network error"));

        assertThatThrownBy(() -> service.process(1L, 1L, buildRequest()))
                .isInstanceOf(RuntimeException.class);

        verify(contributionRepository, atLeastOnce()).save(argThat(con -> "REJECTED".equals(con.getStatus())));
    }

    // --- getStatus ---

    @Test
    void getStatus_whenUserDoesNotOwnContribution_throwsSecurityException() {
        Contribution c = contributionWithStatus("APPROVED", 1L);
        when(contributionRepository.findById(1L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.getStatus(1L, 999L))
                .isInstanceOf(SecurityException.class);
    }

    // --- helpers ---

    private Contribution contributionWithStatus(String status, Long userId) {
        Contribution c = new Contribution();
        ReflectionTestUtils.setField(c, "id", 1L);
        c.setIdUser(userId);
        c.setIdCampaign(10L);
        c.setAmount(new BigDecimal("100"));
        c.setStatus(status);
        return c;
    }

    private ProcessContributionRequest buildRequest() {
        ProcessContributionRequest req = new ProcessContributionRequest();
        req.setToken("tok");
        req.setPaymentMethodId("visa");
        req.setInstallments(1);
        req.setPayerEmail("test@test.com");
        req.setIdentificationType("DNI");
        req.setIdentificationNumber("12345678");
        return req;
    }
}

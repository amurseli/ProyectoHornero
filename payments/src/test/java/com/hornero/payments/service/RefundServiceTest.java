package com.hornero.payments.service;

import com.hornero.payments.client.BackendClient;
import com.hornero.payments.client.LedgerClient;
import com.hornero.payments.dto.RefundSummaryResponse;
import com.hornero.payments.gateway.MercadoPagoGateway;
import com.hornero.payments.model.Contribution;
import com.hornero.payments.model.Refund;
import com.hornero.payments.model.Transaction;
import com.hornero.payments.repository.ContributionRepository;
import com.hornero.payments.repository.RefundRepository;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.net.MPResponse;
import com.mercadopago.resources.payment.PaymentRefund;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefundServiceTest {

    @Mock RefundRepository refundRepository;
    @Mock ContributionRepository contributionRepository;
    @Mock MercadoPagoGateway mercadoPagoGateway;
    @Mock BackendClient backendClient;
    @Mock LedgerClient ledgerClient;
    @Mock PaymentEventLogService paymentEventLogService;

    @InjectMocks RefundService service;

    @Test
    void refundAll_whenNoApprovedContributions_returnsEmptyList() {
        when(contributionRepository.findByIdCampaignAndStatus(1L, "APPROVED")).thenReturn(List.of());
        when(backendClient.getCampaignTitle(1L)).thenReturn("Campaña Solar");

        RefundSummaryResponse response = service.refundAll(1L, "CAMPAIGN_FAILED");

        assertThat(response.getRefunds()).isEmpty();
        assertThat(response.getCampaignId()).isEqualTo(1L);
        verifyNoInteractions(mercadoPagoGateway);
    }

    @Test
    void refundAll_whenContributionHasNoTransaction_marksRefundFailed() {
        Contribution c = contribution(null);
        when(contributionRepository.findByIdCampaignAndStatus(1L, "APPROVED")).thenReturn(List.of(c));
        when(backendClient.getCampaignTitle(1L)).thenReturn("Campaña Solar");
        when(backendClient.getUsername(2L)).thenReturn("mateo");
        when(refundRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RefundSummaryResponse response = service.refundAll(1L, "CAMPAIGN_FAILED");

        assertThat(response.getRefunds()).hasSize(1);
        assertThat(response.getRefunds().get(0).getStatus()).isEqualTo("FAILED");
        verifyNoInteractions(mercadoPagoGateway);
    }

    @Test
    void refundAll_whenMpRefundSucceeds_marksRefundCompletedAndCancelsContribution() throws Exception {
        Transaction tx = new Transaction();
        tx.setIdTransactionExternal("123456");
        tx.setPaymentProvider("MERCADO_PAGO");
        Contribution c = contribution(tx);
        c.setIdUser(2L);

        when(contributionRepository.findByIdCampaignAndStatus(1L, "APPROVED")).thenReturn(List.of(c));
        when(backendClient.getCampaignTitle(1L)).thenReturn("Campaña Solar");
        when(backendClient.getUsername(2L)).thenReturn("mateo");
        when(refundRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PaymentRefund mockRefund = mock(PaymentRefund.class);
        when(mockRefund.getId()).thenReturn(999L);
        when(mercadoPagoGateway.refund(123456L)).thenReturn(mockRefund);
        when(ledgerClient.registerRefundTransaction(eq("mateo"), any(), eq("Campaña Solar"))).thenReturn("0xrefund");

        RefundSummaryResponse response = service.refundAll(1L, "CAMPAIGN_FAILED");

        assertThat(response.getRefunds().get(0).getStatus()).isEqualTo("COMPLETED");
        verify(contributionRepository).save(argThat(con -> "CANCELLED".equals(con.getStatus())));
    }

    @Test
    void refundAll_whenMPApiExceptionOnOneItem_thatItemFailsButLoopContinues() throws Exception {
        Transaction tx1 = new Transaction();
        tx1.setIdTransactionExternal("111");
        tx1.setPaymentProvider("MERCADO_PAGO");

        Transaction tx2 = new Transaction();
        tx2.setIdTransactionExternal("222");
        tx2.setPaymentProvider("MERCADO_PAGO");

        Contribution c1 = contribution(tx1);
        ReflectionTestUtils.setField(c1, "id", 1L);
        c1.setIdUser(2L);
        Contribution c2 = contribution(tx2);
        ReflectionTestUtils.setField(c2, "id", 2L);
        c2.setIdUser(3L);

        when(contributionRepository.findByIdCampaignAndStatus(1L, "APPROVED")).thenReturn(List.of(c1, c2));
        when(backendClient.getCampaignTitle(1L)).thenReturn("Campaña Solar");
        when(backendClient.getUsername(2L)).thenReturn("mateo");
        when(backendClient.getUsername(3L)).thenReturn("lucia");
        when(refundRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MPApiException apiEx = mock(MPApiException.class);
        when(apiEx.getStatusCode()).thenReturn(400);
        MPResponse mpResp = mock(MPResponse.class);
        when(mpResp.getContent()).thenReturn("error");
        when(apiEx.getApiResponse()).thenReturn(mpResp);
        when(mercadoPagoGateway.refund(111L)).thenThrow(apiEx);

        PaymentRefund okRefund = mock(PaymentRefund.class);
        when(okRefund.getId()).thenReturn(999L);
        when(mercadoPagoGateway.refund(222L)).thenReturn(okRefund);
        when(ledgerClient.registerRefundTransaction(eq("lucia"), any(), eq("Campaña Solar"))).thenReturn("0xrefund");

        RefundSummaryResponse response = service.refundAll(1L, "CAMPAIGN_FAILED");

        assertThat(response.getRefunds()).hasSize(2);
        assertThat(response.getRefunds().get(0).getStatus()).isEqualTo("FAILED");
        assertThat(response.getRefunds().get(1).getStatus()).isEqualTo("COMPLETED");
    }

    private Contribution contribution(Transaction tx) {
        Contribution c = new Contribution();
        c.setIdCampaign(1L);
        c.setAmount(new BigDecimal("300"));
        c.setStatus("APPROVED");
        if (tx != null) c.setTransaction(tx);
        return c;
    }
}

package com.hornero.payments.gateway;

import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.client.payment.PaymentRefundClient;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.net.MPSearchRequest;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.payment.PaymentRefund;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class MercadoPagoGatewayImpl implements MercadoPagoGateway {

    @Override
    public Payment create(PaymentCreateRequest request) throws MPException, MPApiException {
        return new PaymentClient().create(request);
    }

    @Override
    public Payment get(Long paymentId) throws MPException, MPApiException {
        return new PaymentClient().get(paymentId);
    }

    @Override
    public PaymentRefund refund(Long paymentId) throws MPException, MPApiException {
        return new PaymentRefundClient().refund(paymentId);
    }

    @Override
    public List<Payment> searchByExternalReference(String externalReference) throws MPException, MPApiException {
        // limit/offset deben ir explicitos: si quedan en null, el SDK los agrega igual
        // al mapa de parametros y rompe con NPE al armar el query string (Map$Entry.getValue().toString())
        MPSearchRequest searchRequest = MPSearchRequest.builder()
                .filters(Map.of("external_reference", externalReference))
                .limit(10)
                .offset(0)
                .build();
        return new PaymentClient().search(searchRequest).getResults();
    }
}

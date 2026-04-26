package com.hornero.payments.gateway;

import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.client.payment.PaymentRefundClient;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.payment.PaymentRefund;
import org.springframework.stereotype.Component;

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
}

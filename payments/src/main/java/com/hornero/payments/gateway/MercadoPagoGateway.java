package com.hornero.payments.gateway;

import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.payment.PaymentRefund;

public interface MercadoPagoGateway {
    Payment create(PaymentCreateRequest request) throws MPException, MPApiException;
    Payment get(Long paymentId) throws MPException, MPApiException;
    PaymentRefund refund(Long paymentId) throws MPException, MPApiException;
}

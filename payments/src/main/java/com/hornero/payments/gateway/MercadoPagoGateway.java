package com.hornero.payments.gateway;

import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.payment.PaymentRefund;

import java.util.List;

public interface MercadoPagoGateway {
    Payment create(PaymentCreateRequest request) throws MPException, MPApiException;
    Payment get(Long paymentId) throws MPException, MPApiException;
    PaymentRefund refund(Long paymentId) throws MPException, MPApiException;

    // Busca pagos por external_reference (usamos el id de la contribucion como referencia
    // al crear la Preference). Permite recuperar el pago real cuando nunca se persistio
    // la Transaction local, por ejemplo si el usuario completo el pago pero el callback
    // de retorno nunca llego a procesarse.
    List<Payment> searchByExternalReference(String externalReference) throws MPException, MPApiException;
}

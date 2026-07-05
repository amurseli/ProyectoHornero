-- Evita registrar 2 transacciones para el mismo pago de MercadoPago cuando
-- process() (retorno del checkout) y handleWebhook() corren en paralelo
-- para el mismo id_transaction_external
CREATE UNIQUE INDEX uq_transaction_external_id
    ON payments.transaction (id_transaction_external)
    WHERE id_transaction_external IS NOT NULL;

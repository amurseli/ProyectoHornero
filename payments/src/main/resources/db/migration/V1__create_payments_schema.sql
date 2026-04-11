CREATE SCHEMA IF NOT EXISTS payments;

-- Representa el aporte del usuario a una campana (el "que quiero pagar")
-- Un mismo usuario puede tener multiples contributions a la misma campana
-- Cada intento de pago genera una nueva contribution (una fallida queda REJECTED)
CREATE TABLE payments.contribution (
    id          BIGSERIAL     PRIMARY KEY,
    id_user     BIGINT        NOT NULL,
    id_campaign BIGINT        NOT NULL,
    amount      NUMERIC(15,2) NOT NULL,
    status      VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);
-- status: PENDING | APPROVED | REJECTED | CANCELLED | IN_PROCESS

-- Representa la ejecucion tecnica del pago (el "como se pago")
CREATE TABLE payments.transaction (
    id                 BIGSERIAL     PRIMARY KEY,
    id_contribution    BIGINT        NOT NULL REFERENCES payments.contribution(id),
    amount             NUMERIC(15,2) NOT NULL,
    transaction_method VARCHAR(30)   NOT NULL,
    CBU_origin         VARCHAR(50),
    CBU_destination    VARCHAR(50),
    id_transaction_mp  BIGINT,
    created_at         TIMESTAMP     NOT NULL DEFAULT NOW()
);
-- transaction_method: CARD | TRANSFER | MP_WALLET
-- CBU_origin y CBU_destination son nullable (solo aplican a transferencias)
-- id_transaction_mp es nullable (se completa al procesar con MercadoPago)

-- TODO: agregar tabla transaction_logs (id, id_transaction, state, friendly_message, created_at) en iteracion futura

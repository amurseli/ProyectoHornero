-- V3: Tablas para payout al creador y refund a los aportantes

-- Representa la transferencia del dinero recaudado al creador cuando la campaña es exitosa.
-- Una campaña SUCCESSFUL genera exactamente un payout.
-- net_amount = gross_amount - platform_fee - provider_fee
CREATE TABLE payments.payout (
    id                  BIGSERIAL       PRIMARY KEY,
    id_campaign         BIGINT          NOT NULL,
    id_creator_user     BIGINT          NOT NULL,
    gross_amount        NUMERIC(15,2)   NOT NULL,   -- suma de contributions APPROVED de la campaña
    platform_fee        NUMERIC(15,2)   NOT NULL,   -- comisión de la plataforma (snapshot al momento del payout)
    provider_fee        NUMERIC(15,2)   NOT NULL,   -- comisión del proveedor de pagos (snapshot al momento del payout)
    net_amount          NUMERIC(15,2)   NOT NULL,   -- lo que efectivamente recibe el creador
    payment_provider    VARCHAR(30)     NOT NULL,   -- MERCADO_PAGO | etc
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    id_payout_external  VARCHAR(50),                -- ID del payout en el proveedor (nullable hasta ejecución)
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    processed_at        TIMESTAMP                   -- cuando el proveedor confirmó la transferencia
);
-- status: PENDING | PROCESSING | COMPLETED | FAILED

-- Representa el reembolso individual a un aportante cuando la campaña falla o es cancelada.
-- Cada contribution APPROVED de una campaña FAILED/CANCELLED genera un registro aquí.
CREATE TABLE payments.refund (
    id                   BIGSERIAL       PRIMARY KEY,
    id_contribution      BIGINT          NOT NULL REFERENCES payments.contribution(id),
    amount               NUMERIC(15,2)   NOT NULL,
    payment_provider     VARCHAR(30)     NOT NULL,  -- mismo proveedor que procesó la contribution original (mmm creo)
    status               VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    id_refund_external   VARCHAR(50),               -- ID del refund en el proveedor (nullable hasta ejecución)
    reason               VARCHAR(50)     NOT NULL,  -- CAMPAIGN_FAILED | CAMPAIGN_CANCELLED
    created_at           TIMESTAMP       NOT NULL DEFAULT NOW(),
    processed_at         TIMESTAMP
);
-- status: PENDING | COMPLETED | FAILED
-- Si el refund falla, queda en FAILED y requiere gestión manual del admin (TODO: ver casos puntuales luego)

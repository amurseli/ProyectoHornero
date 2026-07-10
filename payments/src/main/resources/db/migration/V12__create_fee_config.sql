-- V12: Configuración de comisiones editable desde el backoffice.
-- Tabla append-only: cada cambio de tasa inserta una fila nueva, nunca se actualiza ni
-- borra una existente. La tasa vigente es la fila con mayor id. Esto conserva el historial
-- completo de quién cambió qué y cuándo, y no afecta los payouts ya calculados, que ya
-- persisten sus montos concretos.
CREATE TABLE payments.fee_config (
    id                  BIGSERIAL       PRIMARY KEY,
    platform_rate       NUMERIC(6,4)    NOT NULL,   -- ej. 0.05 = 5%
    provider_rate       NUMERIC(6,4)    NOT NULL,   -- ej. 0.046 = 4.6% (Mercado Pago)
    updated_by_user_id  BIGINT          NOT NULL,   -- admin que hizo el cambio (0 = seed inicial)
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Semilla con los valores actuales de application.properties, para que siempre exista
-- una fila vigente y no cambie ningún comportamiento hasta que un admin edite algo.
INSERT INTO payments.fee_config (platform_rate, provider_rate, updated_by_user_id)
VALUES (0.05, 0.046, 0);

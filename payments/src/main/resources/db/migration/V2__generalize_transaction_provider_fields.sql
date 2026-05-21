-- V2: Generalizar campos de proveedor en payments.transaction
-- Motivo: Por si en el futuro queremos integrar otros proveedores de pago

-- 1. Agregar el campo genérico id_transaction_external como VARCHAR
ALTER TABLE payments.transaction
    ADD COLUMN id_transaction_external VARCHAR(50);

-- 2. Migrar los valores existentes (numéricos de MP) al nuevo campo
UPDATE payments.transaction
SET id_transaction_external = id_transaction_mp::TEXT
WHERE id_transaction_mp IS NOT NULL;

-- 3. Eliminar el campo específico de MercadoPago
ALTER TABLE payments.transaction
    DROP COLUMN id_transaction_mp;

-- 4. Agregar campo payment_provider para identificar el proveedor que procesó cada transacción
--    DEFAULT 'MERCADO_PAGO' para que los registros existentes queden correctos
ALTER TABLE payments.transaction
    ADD COLUMN payment_provider VARCHAR(30) NOT NULL DEFAULT 'MERCADO_PAGO';
-- payment_provider: MERCADO_PAGO | MODO  etc.

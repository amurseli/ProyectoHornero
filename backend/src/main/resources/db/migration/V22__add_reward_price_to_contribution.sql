-- En lugar de esto:
ALTER TABLE payments.contribution
    ADD COLUMN reward_price NUMERIC(15, 2);

-- Usar esto:
ALTER TABLE payments.contribution
    ADD COLUMN IF NOT EXISTS reward_price NUMERIC(15, 2);
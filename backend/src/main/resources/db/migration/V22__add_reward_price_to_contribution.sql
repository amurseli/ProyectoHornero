
ALTER TABLE payments.contribution
    ADD COLUMN IF NOT EXISTS reward_price NUMERIC(15, 2);
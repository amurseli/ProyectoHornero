ALTER TABLE payments.transaction
ADD COLUMN IF NOT EXISTS hash_tx VARCHAR(120);

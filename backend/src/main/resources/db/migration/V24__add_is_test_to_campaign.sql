-- Marks campaigns created by the dev test-data seeder so the frontend can
-- visually disable contributions and the cleanup routine can target them.
ALTER TABLE campaign
    ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT FALSE;

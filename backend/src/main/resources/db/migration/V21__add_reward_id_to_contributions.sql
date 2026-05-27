-- Adds reward_id to payments.contribution.
-- The payments.contribution table is owned by the payments microservice,
-- so this ALTER is guarded: on a fresh DB where the payments schema does
-- not yet exist, the migration is a no-op and will be re-applied (idempotently)
-- on later boots once the payments service has provisioned the schema.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'payments' AND table_name = 'contribution'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'payments' AND table_name = 'contribution' AND column_name = 'reward_id'
    ) THEN
        ALTER TABLE payments.contribution ADD COLUMN reward_id BIGINT;
    END IF;
END
$$;

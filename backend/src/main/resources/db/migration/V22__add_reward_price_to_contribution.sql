-- Adds reward_price to payments.contribution. See V21 note.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'payments' AND table_name = 'contribution'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'payments' AND table_name = 'contribution' AND column_name = 'reward_price'
    ) THEN
        ALTER TABLE payments.contribution ADD COLUMN reward_price NUMERIC(15, 2);
    END IF;
END
$$;

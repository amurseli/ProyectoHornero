-- Adds hash_tx to payments.transaction. See V21 note.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'payments' AND table_name = 'transaction'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'payments' AND table_name = 'transaction' AND column_name = 'hash_tx'
    ) THEN
        ALTER TABLE payments.transaction ADD COLUMN hash_tx VARCHAR(120);
    END IF;
END
$$;

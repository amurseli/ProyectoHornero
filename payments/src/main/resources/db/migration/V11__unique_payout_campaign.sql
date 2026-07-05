-- Evita registrar 2 payouts para la misma campaña cuando executePayout()
-- corre en paralelo (ej: el script de cron reintenta finalize-campaigns
-- mientras la corrida anterior todavia esta procesando la misma campaña).
CREATE UNIQUE INDEX uq_payout_campaign
    ON payments.payout (id_campaign);

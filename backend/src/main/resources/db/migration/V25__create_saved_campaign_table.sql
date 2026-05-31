CREATE TABLE IF NOT EXISTS saved_campaign (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    campaign_id BIGINT NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_saved_campaign_user_campaign UNIQUE (user_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_campaign_user_created_at
    ON saved_campaign(user_id, created_at DESC);

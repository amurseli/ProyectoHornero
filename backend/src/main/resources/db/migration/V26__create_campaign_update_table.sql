CREATE TABLE campaign_update (
    id BIGSERIAL PRIMARY KEY,
    id_campaign BIGINT NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaign_update_campaign_created_at
    ON campaign_update (id_campaign, created_at DESC);

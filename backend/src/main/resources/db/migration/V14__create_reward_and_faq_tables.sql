DROP TABLE IF EXISTS reward CASCADE;
DROP TABLE IF EXISTS goal CASCADE;

CREATE TABLE reward (
    id BIGSERIAL PRIMARY KEY,
    id_campaign BIGINT NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(15,2) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reward_campaign ON reward(id_campaign);

CREATE TABLE campaign_faq (
    id BIGSERIAL PRIMARY KEY,
    id_campaign BIGINT NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaign_faq_campaign ON campaign_faq(id_campaign);
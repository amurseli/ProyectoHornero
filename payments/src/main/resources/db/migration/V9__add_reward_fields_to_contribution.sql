ALTER TABLE payments.contribution
    ADD COLUMN reward_id BIGINT,
    ADD COLUMN reward_price NUMERIC(15,2);

CREATE INDEX idx_contribution_user_campaign_status
    ON payments.contribution(id_user, id_campaign, status);

CREATE INDEX idx_contribution_reward_id
    ON payments.contribution(reward_id);

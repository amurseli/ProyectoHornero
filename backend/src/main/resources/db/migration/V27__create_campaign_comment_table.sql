CREATE TABLE campaign_comment (
    id BIGSERIAL PRIMARY KEY,
    id_campaign BIGINT NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
    id_author BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    parent_comment_id BIGINT REFERENCES campaign_comment(id) ON DELETE CASCADE,
    content VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaign_comment_campaign_created_at
    ON campaign_comment (id_campaign, created_at ASC);

CREATE INDEX idx_campaign_comment_parent
    ON campaign_comment (parent_comment_id, created_at ASC);

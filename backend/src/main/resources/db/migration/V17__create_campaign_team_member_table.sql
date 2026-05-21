-- =============================================================================
-- V17: campaign_team_member — the people behind a campaign.
--
-- Powers the "Equipo" section of the draft editor (Kickstarter-style team
-- showcase): each row is a freeform member with a name, role, short bio and
-- an optional photo.  Independent of the user-account `creators_campaign`
-- link table, so members can be listed without having a platform account.
-- =============================================================================

CREATE TABLE campaign_team_member (
    id            BIGSERIAL PRIMARY KEY,
    id_campaign   BIGINT NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
    name          VARCHAR(200) NOT NULL,
    role          VARCHAR(200),
    bio           TEXT,
    image_base64  TEXT,
    display_order INT DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaign_team_member_campaign ON campaign_team_member(id_campaign);

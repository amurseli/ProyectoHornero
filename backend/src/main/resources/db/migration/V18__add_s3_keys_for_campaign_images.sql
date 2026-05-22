ALTER TABLE campaign_media
    ADD COLUMN s3_key VARCHAR(500);

ALTER TABLE reward
    ADD COLUMN image_s3_key VARCHAR(500);

ALTER TABLE campaign_team_member
    ADD COLUMN image_s3_key VARCHAR(500);

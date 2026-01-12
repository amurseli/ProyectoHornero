-- Add OAuth2 fields to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500);

-- Make password nullable for OAuth users
ALTER TABLE "user" ALTER COLUMN password DROP NOT NULL;

-- Create index for OAuth lookups
CREATE INDEX IF NOT EXISTS idx_user_oauth ON "user"(oauth_provider, oauth_id);

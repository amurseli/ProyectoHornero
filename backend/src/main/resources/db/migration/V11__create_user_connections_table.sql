-- Create user_connections table to store OAuth provider connections
-- This replaces the oauth_provider/oauth_id columns on the user table
CREATE TABLE IF NOT EXISTS user_connections (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,          -- 'google', 'github', etc.
    provider_id VARCHAR(255) NOT NULL,      -- Provider's unique user ID (e.g. Google "sub")
    provider_email VARCHAR(255),            -- Email from the provider at time of connection
    display_name VARCHAR(255),              -- Name from the provider
    profile_image_url VARCHAR(500),         -- Avatar URL from the provider
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uk_user_provider UNIQUE (user_id, provider),
    CONSTRAINT uk_provider_provider_id UNIQUE (provider, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_provider ON user_connections(provider, provider_id);

-- Migrate existing data from user table into user_connections
INSERT INTO user_connections (user_id, provider, provider_id, provider_email, profile_image_url)
SELECT id, oauth_provider, oauth_id, email, profile_image_url
FROM "user"
WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Remove legacy OAuth columns from user table
ALTER TABLE "user" DROP COLUMN IF EXISTS oauth_provider;
ALTER TABLE "user" DROP COLUMN IF EXISTS oauth_id;
ALTER TABLE "user" DROP COLUMN IF EXISTS profile_image_url;

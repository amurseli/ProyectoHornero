CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_password_reset_token_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_token_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token_expires_at ON password_reset_tokens(expires_at);

-- Note: Ensuring only one active token per user is enforced at application level
-- via PasswordResetService.invalidateAllByUser() before creating new tokens

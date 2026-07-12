-- Códigos de confirmación de 6 dígitos por email, alternativa a la contraseña
-- para confirmar cambios en los datos bancarios del creador (payout account).
CREATE TABLE bank_info_confirmation_code (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_bank_info_confirmation_code_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX idx_bank_info_confirmation_code_user_id ON bank_info_confirmation_code(user_id);

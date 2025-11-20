-- Tabla de roles
CREATE TABLE IF NOT EXISTS role (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Insert default roles
INSERT INTO role (name, description) VALUES ('ADMIN', 'Administrator role with full permissions')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role (name, description) VALUES ('CREATOR', 'Campaign creator role with permissions to create and manage campaigns')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role (name, description) VALUES ('CONTRIBUTOR', 'Role for users that can contribute to campaigns')
ON CONFLICT (name) DO NOTHING;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS "user" (
    id BIGSERIAL PRIMARY KEY,
    user_name VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    gender VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30),
    id_role BIGINT REFERENCES role(id),
    bio TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    disabled_at TIMESTAMP
);

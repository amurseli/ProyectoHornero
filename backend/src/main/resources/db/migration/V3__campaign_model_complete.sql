
-- 1. Tabla campaign_category
CREATE TABLE IF NOT EXISTS campaign_category (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url VARCHAR(500)
);

INSERT INTO campaign_category (name, description, icon_url) VALUES
    ('Tecnología', 'Proyectos de innovación tecnológica y software', NULL),
    ('Educación', 'Iniciativas educativas y de formación', NULL),
    ('Salud', 'Proyectos relacionados con salud y bienestar', NULL),
    ('Medio Ambiente', 'Iniciativas ecológicas y sustentables', NULL),
    ('Arte y Cultura', 'Proyectos artísticos y culturales', NULL),
    ('Comunidad', 'Iniciativas comunitarias y sociales', NULL)
ON CONFLICT (name) DO NOTHING;

-- 2. Alterar campaign
ALTER TABLE campaign
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS end_date DATE,
    ADD COLUMN IF NOT EXISTS current_amount DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS target_amount DECIMAL(15,2);

ALTER TABLE campaign
    DROP COLUMN IF EXISTS id_type;

ALTER TABLE campaign
    ADD CONSTRAINT fk_campaign_category FOREIGN KEY (id_category) REFERENCES campaign_category(id),
    ADD CONSTRAINT fk_campaign_owner FOREIGN KEY (id_owner) REFERENCES "user"(id);

-- 3. Tabla campaign_media
CREATE TABLE IF NOT EXISTS campaign_media (
    id BIGSERIAL PRIMARY KEY,
    id_campaign BIGINT NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
    media_type VARCHAR(10) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Tabla creators_campaign
CREATE TABLE IF NOT EXISTS creators_campaign (
    id BIGSERIAL PRIMARY KEY,
    id_campaign BIGINT NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
    id_user BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'OWNER',
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(id_campaign, id_user)
);
-- =============================================================================
-- V16: Taxonomy tables for campaign creation / edit forms.
--
--   * campaign_category   — replaced with the canonical wizard list (Arte,
--                            Cómics, Baile, …).  Legacy categories that are no
--                            longer used are removed, unless a campaign still
--                            references them (kept to avoid breaking the FK).
--
--   * country             — list of supported countries.  Only Argentina is
--                            seeded for the moment; the wizard's country step
--                            will read from this table.
--
--   * currency            — list of supported currencies, with the Stripe-style
--                            minor_unit factor used to convert between display
--                            and storage units.  For ARS the factor is 100
--                            (i.e. 1 peso = 100 minor units / centavos).
-- =============================================================================

-- 1. Canonical campaign categories -------------------------------------------
INSERT INTO campaign_category (name, description, icon_url) VALUES
    ('Arte',          'Pintura, escultura y artes visuales',              NULL),
    ('Comics',        'Historietas, novelas gráficas y manga',            NULL),
    ('Baile',         'Danza, coreografía y espectáculos',                NULL),
    ('Diseño',        'Diseño gráfico, industrial y de producto',         NULL),
    ('Moda',          'Indumentaria, accesorios y tendencias',            NULL),
    ('Películas',     'Cine, cortos y producciones audiovisuales',        NULL),
    ('Comida',        'Gastronomía, recetas y emprendimientos foodie',    NULL),
    ('Juegos',        'Juegos de mesa, video y experiencias lúdicas',     NULL),
    ('Periodismo',    'Reportajes, investigación y prensa independiente', NULL),
    ('Música',        'Discos, conciertos y proyectos musicales',         NULL),
    ('Fotografía',    'Fotografía documental, artística y editorial',     NULL),
    ('Publicaciones', 'Libros, revistas y publicaciones impresas',        NULL),
    ('Tecnología',    'Hardware, software y proyectos digitales',         NULL),
    ('Teatro',        'Obras teatrales y artes escénicas',                NULL)
ON CONFLICT (name) DO NOTHING;

-- Remove legacy / duplicate categories not in the canonical list.
-- Categories still referenced by a campaign are preserved to keep the FK valid.
DELETE FROM campaign_category
WHERE name NOT IN (
        'Arte', 'Comics', 'Baile', 'Diseño', 'Moda', 'Películas', 'Comida',
        'Juegos', 'Periodismo', 'Música', 'Fotografía', 'Publicaciones',
        'Tecnología', 'Teatro'
      )
  AND id NOT IN (
        SELECT DISTINCT id_category FROM campaign WHERE id_category IS NOT NULL
      );

-- 2. country table ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS country (
    id   BIGSERIAL PRIMARY KEY,
    code VARCHAR(2)   NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO country (code, name) VALUES
    ('AR', 'Argentina')
ON CONFLICT (code) DO NOTHING;

-- 3. currency table -----------------------------------------------------------
--   minor_unit follows Stripe's convention: the smallest unit factor used to
--   store and exchange monetary amounts (e.g. ARS = 100 → 1 peso = 100 centavos).
CREATE TABLE IF NOT EXISTS currency (
    id         BIGSERIAL PRIMARY KEY,
    code       VARCHAR(3)   NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    symbol     VARCHAR(8)   NOT NULL,
    minor_unit INTEGER      NOT NULL DEFAULT 100
);

INSERT INTO currency (code, name, symbol, minor_unit) VALUES
    ('ARS', 'Peso argentino', '$', 100)
ON CONFLICT (code) DO NOTHING;

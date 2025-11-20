CREATE TABLE IF NOT EXISTS campaign (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT,
  id_owner BIGINT,
  id_type BIGINT,
  id_category BIGINT
);

CREATE TABLE IF NOT EXISTS campaign (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT,
  id_owner INT,
  id_type INT,
  id_category INT
);

CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  director VARCHAR(255) NOT NULL,
  genres TEXT[] NOT NULL,
  release_year INT NOT NULL,
  description TEXT
);

CREATE TABLE users (
  id SERIAL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(72) NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
);

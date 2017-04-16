
exports.up = knex => (
  knex.raw(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL UNIQUE,
      username VARCHAR(255) UNIQUE,
      password VARCHAR(72),
      nickname VARCHAR(255),
      registered boolean NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
    );
  `)
)

exports.down = knex => (
  knex.raw('DROP TABLE IF EXISTS users CASCADE;')
)

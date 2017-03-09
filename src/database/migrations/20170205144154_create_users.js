
exports.up = knex => (
  knex.raw(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL UNIQUE,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(72) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
    );
  `)
)

exports.down = knex => (
  knex.raw('DROP TABLE IF EXISTS users CASCADE;')
)

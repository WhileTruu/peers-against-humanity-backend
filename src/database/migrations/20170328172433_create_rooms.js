exports.up = knex => (
  knex.raw(`
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL UNIQUE,
      owner_id INTEGER,
      active boolean NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
    );

    ALTER TABLE rooms ADD CONSTRAINT FK_rooms_owner_id
      FOREIGN KEY (owner_id)
      REFERENCES users (id)
      ON UPDATE Cascade
    ;

    ALTER SEQUENCE rooms_id_seq RESTART WITH 10000;
  `)
)

exports.down = knex => (
  knex.raw('DROP TABLE IF EXISTS rooms')
)

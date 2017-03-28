exports.up = knex => (
  knex.raw(`
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL UNIQUE,
      creator_id INTEGER NOT NULL,
      owner_id INTEGER,
      started boolean NOT NULL,
      finished boolean NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
    );

    ALTER TABLE rooms ADD CONSTRAINT FK_rooms_owner_id
      FOREIGN KEY (owner_id)
      REFERENCES users (id)
      ON UPDATE Cascade
    ;

    ALTER TABLE rooms ADD CONSTRAINT FK_rooms_creator_id
      FOREIGN KEY (creator_id)
      REFERENCES users (id)
      ON UPDATE Cascade
    ;

    ALTER SEQUENCE rooms_id_seq START WITH 10000;
  `)
)

exports.down = knex => (
  knex.raw('DROP TABLE IF EXISTS rooms')
)

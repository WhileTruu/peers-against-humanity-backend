
exports.up = knex => (
  knex.raw(`
    CREATE TABLE IF NOT EXISTS room_members (
      room_id integer NOT NULL,
      user_id integer NOT NULL,
      active boolean NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
    );

    ALTER TABLE room_members ADD CONSTRAINT FK_room_members_room_id
      FOREIGN KEY (room_id)
      REFERENCES rooms (id)
      ON UPDATE Cascade
    ;

    ALTER TABLE room_members ADD CONSTRAINT FK_room_members_user_id
      FOREIGN KEY (user_id)
      REFERENCES users (id)
      ON UPDATE Cascade
    ;
  `)
)

exports.down = knex => (
  knex.raw('DROP TABLE IF EXISTS room_members CASCADE;')
)

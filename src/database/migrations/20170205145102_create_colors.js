
exports.up = knex => (
  knex.raw(`
    CREATE TABLE IF NOT EXISTS colors (
      id SMALLINT UNIQUE,
      name VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
    );

    ALTER TABLE colors ADD CONSTRAINT PK_colors_id
      PRIMARY KEY (id)
    ;

    ALTER TABLE colors ADD CONSTRAINT UQ_colors_name UNIQUE (name)
    ;

    insert into colors(id, name) values (1, 'white');
    insert into colors(id, name) values (2, 'black');
  `)
)

exports.down = knex => (
  knex.raw('DROP TABLE IF EXISTS colors CASCADE;')
)

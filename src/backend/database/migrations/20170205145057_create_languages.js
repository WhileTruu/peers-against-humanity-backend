
exports.up = function(knex, Promise) {
  return knex.raw(`
    CREATE TABLE languages (
      id SMALLINT UNIQUE,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
    );

    ALTER TABLE languages ADD CONSTRAINT PK_languages_id
      PRIMARY KEY (id)
    ;

    ALTER TABLE languages ADD CONSTRAINT UQ_languages_name UNIQUE (name)
    ;

    insert into languages(id, name) values (1, 'english');
    insert into languages(id, name) values (2, 'estonian');
  `)
};

exports.down = function(knex, Promise) {
  return knex.raw(`DROP TABLE IF EXISTS languages CASCADE`)
};

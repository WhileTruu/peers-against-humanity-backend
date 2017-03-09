
exports.up = knex => (
  knex.raw(`
    CREATE TABLE IF NOT EXISTS card_categories (
      id SERIAL UNIQUE,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
    );

    ALTER TABLE card_categories ADD CONSTRAINT PK_card_categories_id
      PRIMARY KEY (id)
    ;

    ALTER TABLE card_categories ADD CONSTRAINT UQ_card_categories_name UNIQUE (name)
    ;

    ALTER TABLE card_categories ADD CONSTRAINT CHK_card_categories_text_not_empty
      CHECK (btrim(name) <> '')
    ;
  `)
)

exports.down = knex => (
  knex.raw('DROP TABLE IF EXISTS card_categories CASCADE')
)


exports.up = knex => (
  knex.raw(`
    CREATE TABLE IF NOT EXISTS black_cards (
      id SERIAL UNIQUE,
      language VARCHAR(3) NOT NULL,
      text VARCHAR(255) NOT NULL,
      pick SMALLINT,
      user_id INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
    );

    ALTER TABLE black_cards ADD CONSTRAINT FK_black_cards_user_id
      FOREIGN KEY (user_id)
      REFERENCES users (id)
      ON UPDATE Cascade
    ;

    ALTER TABLE black_cards ADD CONSTRAINT UQ_black_cards_text UNIQUE (text);

    ALTER TABLE black_cards
      ADD CONSTRAINT CHK_black_cards_text_not_empty
      CHECK (btrim(text) <> '')
    ;

    ALTER TABLE black_cards
      ADD CONSTRAINT CHK_black_cards_language_not_empty
      CHECK (btrim(language) <> '')
    ;
  `)
)

exports.down = knex => (
  knex.raw('DROP TABLE IF EXISTS black_cards')
)

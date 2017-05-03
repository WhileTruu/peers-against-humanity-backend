
exports.up = knex => (
  knex.raw(`
    CREATE TABLE IF NOT EXISTS white_cards (
      id SERIAL UNIQUE,
      language VARCHAR(3) NOT NULL,
      text VARCHAR(255) NOT NULL,
      user_id INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
    );

    ALTER TABLE white_cards
      ADD CONSTRAINT FK_white_cards_user_id
      FOREIGN KEY (user_id)
      REFERENCES users (id)
      ON UPDATE Cascade
    ;

    ALTER TABLE white_cards
      ADD CONSTRAINT UQ_white_cards_text
      UNIQUE (text)
    ;

    ALTER TABLE white_cards
      ADD CONSTRAINT CHK_white_cards_text_not_empty
      CHECK (btrim(text) <> '')
    ;

    ALTER TABLE white_cards
      ADD CONSTRAINT CHK_white_cards_language_not_empty
      CHECK (btrim(language) <> '')
    ;
  `)
)

exports.down = knex => (
  knex.raw('DROP TABLE IF EXISTS white_cards')
)

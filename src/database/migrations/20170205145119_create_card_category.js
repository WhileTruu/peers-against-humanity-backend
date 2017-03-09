
exports.up = knex => (
  knex.raw(`
    CREATE TABLE IF NOT EXISTS card_category (
      card_id integer NOT NULL,
      category_id integer NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
    );

    ALTER TABLE card_category ADD CONSTRAINT FK_card_category_card_id
      FOREIGN KEY (card_id)
      REFERENCES cards (id)
      ON UPDATE Cascade
    ;

    ALTER TABLE card_category ADD CONSTRAINT FK_card_category_category_id
      FOREIGN KEY (category_id)
      REFERENCES card_categories (id)
      ON UPDATE Cascade
    ;
  `)
)

exports.down = knex => (
  knex.raw('DROP TABLE IF EXISTS card_category CASCADE;')
)

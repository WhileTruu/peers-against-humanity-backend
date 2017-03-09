
exports.seed = (knex, Promise) => (
  // Deletes ALL existing entries
  knex('card_categories').del()
    .then(() => Promise.all([
      // Inserts seed entries
      knex('card_categories').insert({ name: 'A Game of Thrones' }),
      knex('card_categories').insert({ name: 'Default' }),
      knex('card_categories').insert({ name: 'Nerdy' }),
    ]),
  )
)

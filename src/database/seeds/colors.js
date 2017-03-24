
exports.seed = (knex, Promise) => (
  // Deletes ALL existing entries
  knex('colors').del()
    .then(() => Promise.all([
      // Inserts seed entries
      knex('colors').insert({ id: 1, name: 'white' }),
      knex('colors').insert({ id: 2, name: 'black' }),
    ]))
)

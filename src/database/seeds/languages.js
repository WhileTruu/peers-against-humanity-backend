
exports.seed = (knex, Promise) => (
  // Deletes ALL existing entries
  knex('languages').del()
    .then(() => Promise.all([
      // Inserts seed entries
      knex('languages').insert({ id: 1, name: 'english' }),
      knex('languages').insert({ id: 2, name: 'estonian' }),
    ]),
  )
)

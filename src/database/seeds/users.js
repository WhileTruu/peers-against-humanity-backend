
exports.seed = (knex, Promise) => (
  // Deletes ALL existing entries
  knex('users').del()
    .then(() => Promise.all([
      // Inserts seed entries
      knex('users').insert({
        username: 'TheLegend27',
        password: '$2a$10$q6Ktp1YjbjphHYXcmEzHkOzxSsd7gOQIHABcP76uqq33uSUOmmNO6',
      }),
    ]),
  )
)

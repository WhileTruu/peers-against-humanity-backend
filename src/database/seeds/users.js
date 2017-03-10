import { hash } from 'bcrypt'

exports.seed = (knex, Promise) => (
  // Deletes ALL existing entries
  knex('users').del()
    .then(() => hash('password', 10)
      .then(hashedPassword =>
        Promise.all([
          // Inserts seed entries
          knex('users').insert({
            username: 'TheLegend27',
            password: hashedPassword,
          }),
        ]),
      ),
    )
)

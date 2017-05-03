const baseSet = require('../cardSets/base.json')

exports.seed = (knex, Promise) => (
  knex('white_cards').del()
    .then(() => Promise.all(baseSet.whiteCards.map(text => (
      knex('white_cards').insert({
        language: 'eng',
        text,
      })
    ))))
)

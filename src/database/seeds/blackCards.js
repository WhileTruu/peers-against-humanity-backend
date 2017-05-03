const baseSet = require('../cardSets/base.json')

exports.seed = (knex, Promise) => (
  knex('black_cards').del()
    .then(() => Promise.all(baseSet.blackCards.map(blackCard => (
      knex('black_cards').insert({
        language: 'eng',
        text: blackCard.text,
        pick: blackCard.pick,
      })
    ))))
)

const baseSet = require('../cardSets/base.json')
const expansionsSet = require('../cardSets/expansions.json')
const gotSet = require('../cardSets/got.json')

/* eslint-disable */
exports.seed = (knex, Promise) => (
  knex('white_cards').del()
    .then(() => Promise.all(baseSet.whiteCards
      .concat(expansionsSet.whiteCards)
      .concat(gotSet.whiteCards)
      .map(text => knex('white_cards')
        .insert({ language: 'eng', text })
        .then(Promise.resolve)
        .catch(error => console.log(error.toString()))
      )
    ))
)

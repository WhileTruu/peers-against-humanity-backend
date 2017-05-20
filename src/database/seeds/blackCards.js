const baseSet = require('../cardSets/base.json')
const expansionsSet = require('../cardSets/expansions.json')
const gotSet = require('../cardSets/got.json')
/* eslint-disable */
exports.seed = (knex, Promise) => (
  knex('black_cards').del()
    .then(() => Promise.all(baseSet.blackCards
      .concat(expansionsSet.blackCards)
      .concat(gotSet.blackCards)
      .map(blackCard => knex('black_cards')
        .insert({ language: 'eng', text: blackCard.text, pick: blackCard.pick })
        .then(Promise.resolve)
        .catch(error => console.log(error.toString()))
      )
    ))
)

import database from '../../database'

function transformCardFromDatabase(card) {
  if (!card) return null
  return {
    id: card.id,
    language: card.language,
    text: card.text,
    pick: card.pick,
    userId: card.user_id,
    createdAt: card.created_at,
  }
}

function transformCardsFromDatabase(cards) {
  return cards.map(transformCardFromDatabase)
}

export function getBlackCards(limit) {
  return database('black_cards')
    .select('*')
    .limit(limit || 1)
    .orderByRaw('RANDOM()')
    .then(transformCardsFromDatabase)
}

export function getWhiteCards(limit) {
  return database('white_cards')
    .select('*')
    .limit(limit || 1)
    .orderByRaw('RANDOM()')
    .then(transformCardsFromDatabase)
}

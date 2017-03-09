import database from '../../database'

export function findById(id) {
  return database('cards').select('*').where({ id }).first()
}

export function findCardByText(text) {
  return database('cards').where({ text }).first()
}

export function getAllCards() {
  return database('cards').select('*')
}

export function connectCardWithCategory(cardId, categoryId) {
  return database('card_category').insert({
    card_id: cardId,
    category_id: categoryId,
  })
}

export function createNewCard(card, categoryId) {
  const { languageId, colorId, text, pickCount, userId } = card
  return new Promise((resolve, reject) => {
    database('cards')
      .returning('id')
      .insert({
        language_id: languageId,
        color_id: colorId,
        text,
        pick_count: pickCount,
        user_id: userId,
      })
      .then((cardResult) => {
        const cardId = cardResult[0]
        connectCardWithCategory(cardId, categoryId)
          .then(() => resolve({ cardId, categoryId }))
          .catch(error => resolve(error))
      })
      .catch(error => reject(error))
  })
}

export function getRandomCard() {
  return database.raw('SELECT * FROM cards ORDER BY RANDOM() LIMIT 1;')
}

export function upVote(cardId, userId) {
  return database('card_votes').returning('id').insert({
    card_id: cardId,
    user_id: userId,
    vote: 1,
  })
}

export function downVote(cardId, userId) {
  return database('card_votes').returning('id').insert({
    card_id: cardId,
    user_id: userId,
    vote: -1,
  })
}

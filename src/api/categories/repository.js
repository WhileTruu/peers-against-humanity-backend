import database from '../../database'

export function addCategory(name) {
  return database('card_categories').returning('id').insert({ name })
}

export function getCategories() {
  return database('card_categories')
}

export function findById(id) {
  return database('card_categories').where({ id }).first()
}

export function findCategoryByName(name) {
  return database('card_categories').where({ name }).first()
}

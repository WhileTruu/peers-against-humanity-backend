import database from '../../database'

export function findByUsername(username) {
  return database('users').where({username}).first()
}

export function findById(id) {
  return database('users').where({id}).first()
}

export function create(username, password) {
  return database('users').returning('id').insert({ username, password })
}

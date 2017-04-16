import database from '../../database'

function transformUserFromDatabase(user) {
  const { id, created_at, username, nickname, registered } = user
  return { id, createdAt: created_at, username, nickname, registered }
}

export function findByUsername(username) {
  return database('users')
    .where({ username })
    .first()
    .then(user => ({ ...transformUserFromDatabase(user), password: user.password }))
}

export function findById(id) {
  return database('users')
    .select(['id', 'created_at', 'username', 'nickname', 'registered'])
    .where({ id })
    .first()
    .then(transformUserFromDatabase)
}

export function create(username, password) {
  return database('users')
    .returning('id')
    .insert({ username, password, registered: true })
    .then(result => findById(result[0]))
}

export function createTemporary(nickname) {
  return database('users')
    .returning('id')
    .insert({ nickname, registered: false })
    .then(result => findById(result[0]))
}

export function makeTemporaryUserPermanent(id, username, password) {
  return database('users').where({ id })
    .returning('id')
    .update({ username, password, registered: true })
    .then(result => findById(result[0]))
}

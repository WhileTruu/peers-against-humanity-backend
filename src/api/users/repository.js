import database from '../../database'

function transformUserFromDatabase(user) {
  const { id, created_at, username, nickname, registered } = user
  return { id, createdAt: created_at, username, nickname, registered }
}

export function findByUsername(username) {
  return database('users')
    .where({ username })
    .first()
    .then((user) => {
      if (user) return ({ ...transformUserFromDatabase(user), password: user.password })
      return null
    })
}

export function findById(id) {
  return database('users')
    .select('id', 'created_at', 'username', 'nickname', 'registered')
    .where({ id })
    .first()
    .then(transformUserFromDatabase)
}

export function create(username, password) {
  return database('users')
    .returning('id')
    .insert({ username, password, registered: true })
    .then(([id]) => findById(id))
}

export function createTemporary(nickname) {
  return database('users')
    .returning('id')
    .insert({ nickname, registered: false })
    .then(([id]) => findById(id))
}

export function makeTemporaryUserPermanent(id, nickname, username, password) {
  return database('users').where({ id })
    .returning('id')
    .update({ nickname, username, password, registered: true })
    .then(() => findById(id))
}

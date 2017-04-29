import database from '../../database'
import { RoomsException } from '../errors'

function transformRoomFromDatabase(room) {
  if (!room) return null
  return {
    id: room.id,
    ownerId: room.owner_id,
    active: room.active,
    createdAt: room.created_at,
    ownerUsername: room.username,
    ownerNickname: room.nickname,
  }
}

function transformRoomsListFromDatabase(rooms) {
  return rooms.map(room => transformRoomFromDatabase(room))
    .reduce((pRoom, nRoom) => ({ ...pRoom, [nRoom.id]: nRoom }), null)
}

export function getRooms() {
  return database('rooms').where({ 'rooms.active': true })
    .innerJoin('users', 'users.id', 'rooms.owner_id')
    .select('rooms.id', 'rooms.active', 'rooms.owner_id', 'users.username', 'users.nickname', 'rooms.created_at')
    .then(transformRoomsListFromDatabase)
}

export function getRoomById(id) {
  return database('rooms').where({ 'rooms.id': id })
    .innerJoin('users', 'users.id', 'rooms.owner_id')
    .select('rooms.id', 'rooms.active', 'rooms.owner_id', 'users.username', 'users.nickname', 'rooms.created_at')
    .first()
    .then(transformRoomFromDatabase)
}

export function createRoom(userId) {
  return database('rooms').returning('*').insert({ owner_id: userId, active: true })
    .then(([room]) => getRoomById(room.id))
}


export function exitRoom(roomId, userId) {
  let where = { 'rooms.owner_id': userId, 'rooms.active': true }
  if (roomId) where = { ...where, 'rooms.id': roomId }
  return database('rooms')
    .innerJoin('users', 'users.id', 'rooms.owner_id')
    .select('rooms.id', 'rooms.active', 'rooms.owner_id', 'users.username', 'users.nickname', 'rooms.created_at')
    .where(where)
    .first()
    .then((untransformedRoom) => {
      if (!untransformedRoom) throw new RoomsException('No room to exit from.')
      const room = transformRoomFromDatabase(untransformedRoom)
      if (!room.active) return Promise.resolve(room)
      // Set room inactive
      return database('rooms').where({ id: room.id }).update({ active: false }).returning('*')
        .then(() => Promise.resolve({ ...room, active: false }))
    })
}

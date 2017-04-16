import database from '../../database'

function transformMembersFromDatabase(members) {
  return members
    .map(member => ({
      id: member.id,
      active: member.active,
      username: member.username,
      nickname: member.nickname,
    }))
    .reduce((pMember, nMember) => ({ ...pMember, [nMember.id]: nMember }), null)
}

function transformRoomFromDatabase(room) {
  return {
    id: room.id,
    creatorId: room.creator_id,
    ownerId: room.owner_id,
    started: room.started,
    finished: room.finished,
    createdAt: room.created_at,
    ownerUsername: room.username,
  }
}

function transformRoomsListFromDatabase(rooms) {
  return rooms
    .map(room => transformRoomFromDatabase(room))
    .reduce((pRoom, nRoom) => ({ ...pRoom, [nRoom.id]: nRoom }), null)
}

export function getRoomMembers(roomId) {
  return new Promise((resolve, reject) => {
    database('room_members')
      .select('*')
      .where({ room_id: roomId })
      .innerJoin('users', function joinOn() { this.on('users.id', '=', 'room_members.user_id') })
      .then(members => resolve(transformMembersFromDatabase(members)))
      .catch(error => reject(error))
  })
}

function removeUserFromRoomMemebers(roomId, userId) {
  return database('room_members')
    .where({ room_id: roomId, user_id: userId })
    .update({ active: false })
    .returning('*')
}

function changeRoomOwner(roomId, newOwnerId) {
  return database('rooms')
    .where({ id: roomId })
    .update({ owner_id: newOwnerId })
    .returning('*')
}

export function setRoomFinished(roomId) {
  return database('rooms')
    .where({ id: roomId })
    .update({ finished: true })
    .returning('*')
}

export function exitRoom(userId) {
  return new Promise((resolve, reject) => {
    database('rooms').where({ finished: false })
      .leftJoin('room_members', function joinOn() { this.on('room_members.room_id', '=', 'rooms.id') })
      .where({ 'room_members.user_id': userId })
      .select('*')
      .first()
      .then((room) => {
        if (!room) resolve(null)
        removeUserFromRoomMemebers(room.id, userId)
          .then(() => {
            database('room_members').select('*').where({ room_id: room.id, active: true })
              .then((roomMembers) => {
                if (roomMembers.length > 0) {
                  resolve(changeRoomOwner(room.id, roomMembers[0].user_id))
                } else {
                  resolve(setRoomFinished(room.id))
                }
              })
          })
      })
      .catch(err => reject(err))
  })
}

export function getRoomById(id) {
  return new Promise((resolve, reject) => {
    database('rooms').where({ 'rooms.id': id })
      .select('rooms.*', 'users.username')
      .innerJoin('users', function joinOn() { this.on('users.id', '=', 'rooms.owner_id') })
      .first()
      .then(results => resolve(transformRoomFromDatabase(results)))
      .catch(error => reject({ message: `getRoomById: ${error.message}` }))
  })
}

export function joinRoom(roomId, userId) {
  return new Promise((resolve, reject) => {
    getRoomById(roomId)
      .then((room) => {
        if (!room) reject('Such a room does not exist')
        if (room.finished) reject(`Room ${roomId} is not active`)
        else {
          database.raw(`
            INSERT INTO room_members (room_id, user_id, active)
            VALUES (?, ?, ?)
            ON CONFLICT (room_id, user_id) DO UPDATE SET active = TRUE
            RETURNING *
          `, [roomId, userId, true])
            .then(() => resolve(room))
            .catch(error => reject(error))
        }
      })
      .catch(error => reject(error))
  })
}

function findRoomByUserId(userId, finished = false) {
  return database('rooms')
    .select('*')
    .innerJoin('room_members', function joinOn() { this.on('room_members.room_id', '=', 'rooms.id') })
    .where({ 'room_members.user_id': userId, 'rooms.finished': finished })
    .first()
}

export function createRoom(userId) {
  return new Promise((resolve, reject) => {
    findRoomByUserId(userId)
      .then((foundRoom) => {
        if (!foundRoom) {
          database('rooms')
            .returning('*')
            .insert({ creator_id: userId, owner_id: userId, started: false, finished: false })
            .then((rooms) => {
              resolve(joinRoom(rooms[0].id, userId))
            })
            .catch(error => reject({ message: `createRoom:insert: ${error.message}` }))
        } else {
          reject({ message: `User: ${userId} is already in a room.` })
        }
      })
      .catch(error => reject({ message: `createRoom:findRoomByUserId: ${error.message}` }))
  })
}

export function getAllRooms() {
  return new Promise((resolve, reject) => {
    database('rooms').where({ 'rooms.finished': false })
      .select('rooms.*', 'users.username')
      .innerJoin('users', function joinOn() { this.on('users.id', '=', 'rooms.owner_id') })
      .then(results => resolve(transformRoomsListFromDatabase(results)))
      .catch(error => reject({ message: `getAllRooms: ${error.message}` }))
  })
}

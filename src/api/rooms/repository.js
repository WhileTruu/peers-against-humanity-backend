import database from '../../database'

function transformMembers(members) {
  return members
    .map(member => ({
      id: member.id,
      active: member.active,
      roomId: member.room_id,
      username: member.username,
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
    members: (room.members ? transformMembers(room.members) : []),
  }
}

function transformRoomsFromDatabase(rooms) {
  return rooms
    .map(room => transformRoomFromDatabase(room))
    .reduce((pRoom, nRoom) => ({ ...pRoom, [nRoom.id]: nRoom }), null)
}

export function joinRoom(roomId, userId) {
  return new Promise((resolve, reject) => {
    database('rooms').where({ finished: false, id: roomId })
      .select('*')
      .first()
      .then((room) => {
        if (!room) reject('no room')
        else {
          database.raw(`
            INSERT INTO room_members (room_id, user_id, active)
            VALUES (?, ?, ?)
            ON CONFLICT (room_id, user_id) DO UPDATE SET active = TRUE
            RETURNING *
          `, [roomId, userId, true])
            .then(() => resolve())
            .catch(error => reject(error))
        }
      })
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

function setRoomFinished(roomId) {
  return database('rooms')
    .where({ id: roomId })
    .update({ finished: true })
    .returning('*')
}

export function exitRoom(userId) {
  // check if user is room owner
  //   if is room owner find the next in line and set him as owner
  //     set user not active
  //     if no next in line set room finished
  //   else
  //     just set user not active
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
                  changeRoomOwner(room.id, roomMembers[0].user_id)
                    .then(result => resolve(result))
                    .catch(error => reject(error))
                } else {
                  setRoomFinished(room.id)
                    .then(result => resolve(result))
                    .catch(error => reject(error))
                }
              })
          })
      })
      .catch(err => reject(err))
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
    // SELECT * FROM rooms INNER JOIN room_members ON rooms.id = room_members.room_id
    // WHERE room_members.user_id = 2 AND rooms.finished = false
    findRoomByUserId(userId)
      .then((foundRoom) => {
        if (!foundRoom) {
          database('rooms')
            .returning('*')
            .insert({
              creator_id: userId,
              owner_id: userId,
              started: false,
              finished: false,
            })
            .then((roomsResult) => {
              const room = roomsResult[0]
              joinRoom(room.id, userId)
                .then(() => resolve(room.id))
                .catch(error => reject({ message: `createRoom:joinRoom: ${error.message}` }))
            })
            .catch(error => reject({ message: `createRoom:insert: ${error.message}` }))
        } else {
          reject({ message: `User: ${userId} is already in a room.` })
        }
      })
      .catch(error => reject({ message: `createRoom:findRoomByUserId: ${error.message}` }))
  })
}

export function getRoomById(id) {
  return new Promise((resolve, reject) => {
    database('rooms').where({ 'rooms.id': id })
      .select('rooms.*', 'users.username', 'members')
      .joinRaw(database.raw(`
        LEFT JOIN (
          SELECT room_id AS id, jsonb_agg(members) AS "members"
          FROM (
            SELECT room_id, id, username, active
            FROM room_members
            INNER JOIN users ON users.id = room_members.user_id
          ) AS members
          GROUP BY 1
        ) room_members USING (id)
        `))
      .innerJoin('users', function joinOn() { this.on('users.id', '=', 'rooms.owner_id') })
      .first()
      .then(results => resolve(transformRoomFromDatabase(results)))
      .catch(error => reject({ message: `getRoomById: ${error.message}` }))
  })
}

export function getAllRooms() {
  return new Promise((resolve, reject) => {
    database('rooms').where({ 'rooms.finished': false })
      .select('rooms.*', 'users.username', 'members')
      .joinRaw(database.raw(`
        LEFT JOIN (
          SELECT room_id AS id, jsonb_agg(members) AS "members"
          FROM (
            SELECT room_id, id, username, active
            FROM room_members
            INNER JOIN users ON users.id = room_members.user_id
          ) AS members
          GROUP BY 1
        ) room_members USING (id)
        `))
      .innerJoin('users', function joinOn() { this.on('users.id', '=', 'rooms.owner_id') })
      .then(results => resolve(transformRoomsFromDatabase(results)))
      .catch(error => reject({ message: `getAllRooms: ${error.message}` }))
  })
}

import database from '../../database'
import { RoomsException } from '../errors'

function transformMembersFromDatabase(members) {
  if (!members) throw new RoomsException('No members to transform from DB.')
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

// USE ONLY IF CERTAIN THE ROOM ACTUALLY EXISTS
export function joinCertainlyExistingRoom(roomId, userId) {
  return database.raw(`
      INSERT INTO room_members (room_id, user_id, active)
      VALUES (?, ?, ?)
      ON CONFLICT (room_id, user_id) DO UPDATE SET active = TRUE
      RETURNING *
    `, [roomId, userId, true])
}

export function makeUserInactiveInAllActiveRooms(userId) {
  // Find all rooms that are active and where user is active.
  return database('rooms').select('rooms.id')
    .innerJoin('room_members', 'rooms.id', 'room_members.room_id')
    .where({ 'rooms.active': true, 'room_members.user_id': userId, 'room_members.active': true })
    // Make user inactive in all rooms
    .then(roomIds => (
      roomIds.forEach(roomId => (
        Promise.all(database('room_members').where({ room_id: roomId, user_id: userId })
          .update({ active: false }))
      ))
    ))
}

export function createRoom(userId) {
  let createdRoom = null
  return makeUserInactiveInAllActiveRooms(userId)
    // Create new room
    .then(() => database('rooms').returning('*').insert({
      owner_id: userId,
      active: true,
    }))
    // Join the room
    .then(([room]) => {
      createdRoom = room
      return joinCertainlyExistingRoom(room.id, userId)
    })
    .then(() => Promise.resolve(transformRoomFromDatabase(createdRoom)))
}

export function exitRoom(roomId, userId) {
  // am I even in this room? is this real life or is this fanta sea
  const whereRoomId = roomId ? { 'rooms.id': roomId } : {}
  return database('rooms').select('rooms.*', 'room_members.user_id')
    .innerJoin('room_members', 'rooms.id', 'room_members.room_id')
    .where({ 'rooms.active': true, 'room_members.user_id': userId, ...whereRoomId })
    .first()
    .then((room) => {
      if (!room) throw new RoomsException('You cannot exit a room you are not in')
      if (room.owner_id === parseInt(userId, 10)) {
        // Set all room members as inactive (I'm the baus), and the room too!
        return database('room_members').where({ room_id: roomId }).update({ active: false })
          .then(() => database('rooms').where({ id: roomId }).update({ active: false }))
      }
      // Set this one specific room member inactive
      return database('room_members')
        .where({ room_id: roomId, user_id: userId })
        .update({ active: false })
    })
    .then(() => Promise.resolve(roomId))
}

export function joinRoom(roomId, userId) {
  // see if the room exists
  let joinedRoom = null
  return database('rooms').where({ id: roomId }).first()
    .then((room) => {
      if (!room) throw new RoomsException('The room does not even exist.')
      joinedRoom = room
      // if room is active, just join it.
      if (room.active) {
        return joinCertainlyExistingRoom(roomId, userId)
          .then(() => Promise.resolve(transformRoomFromDatabase(joinedRoom)))
      }
      // if room doesn't exist see if user has been member
      return database('room_members').where({ room_id: roomId, user_id: userId }).first()
        .then((roomMember) => {
          // if user has not been member throw exception
          if (!roomMember) throw new RoomsException('This is not your room to join.')
          // if user has been member, make user owner, activate and join.
          return database('rooms').where({ id: roomId }).update({ active: true, owner_id: userId })
            .then(() => joinCertainlyExistingRoom(roomId, userId))
            .then(() => Promise.resolve(transformRoomFromDatabase(joinedRoom)))
        })
    })
}

export function getRoomMembers(roomId) {
  return database('room_members').select('*').where({ room_id: roomId, active: true })
    .innerJoin('users', 'users.id', 'room_members.user_id')
    .then(transformMembersFromDatabase)
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

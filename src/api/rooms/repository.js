import database from '../../database'

function transformRoomFromDatabase(room) {
  return {
    id: room.id,
    creatorId: room.creator_id,
    ownerId: room.owner_id,
    started: room.started,
    finished: room.finished,
    createdAt: room.created_at,
    ownerUsername: room.username,
    members: (room.members ? room.members.map(member => ({
      id: member.id,
      active: member.active,
      roomId: member.room_id,
      username: member.username,
    })) : []),
  }
}

function transformRoomsFromDatabase(rooms) {
  return rooms
    .map(room => transformRoomFromDatabase(room))
    .reduce((pRoom, nRoom) => ({ ...pRoom, [nRoom.id]: nRoom }), null)
}

export function joinRoom(roomId, userId) {
  return database('room_members').insert({
    room_id: roomId,
    user_id: userId,
    active: true,
  })
}

function removeFromRoomMemebers(roomId, userId) {
  return database('room_members')
    .where({ room_id: roomId, user_id: userId })
    .update({ active: false })
}

function changeRoomOwner(roomId, newOwnerId) {
  return database('rooms')
    .where({ id: roomId })
    .update({ owner_id: newOwnerId })
}

function setRoomFinished(roomId) {
  return database('rooms')
    .where({ id: roomId })
    .update({ finished: true })
}

export function exitRoom(roomId, userId) {
  // check if user is room owner
  //   if is room owner find the next in line and set him as owner
  //     set user not active
  //     if no next in line set room finished
  //   else
  //     just set user not active
  return new Promise((resolve, reject) => {
    database('rooms').select('*').where({ id: roomId, owner_id: userId })
      .then((rooms) => {
        if (rooms.length) {
          database('room_members').select('*').where({ room_id: roomId, active: true })
            .then((roomMembers) => {
              removeFromRoomMemebers(roomId, userId)
                .then(() => {
                  if (roomMembers.length) {
                    changeRoomOwner(roomId, roomMembers[0].user_id)
                      .then(result => resolve(result))
                      .catch(error => reject(error))
                  } else {
                    setRoomFinished(roomId)
                      .then(result => resolve(result))
                      .catch(error => reject(error))
                  }
                })
                .catch(error => reject(error))
            })
            .catch(error => reject(error))
        } else {
          removeFromRoomMemebers(roomId, userId)
            .then(result => resolve(result))
            .catch(error => reject(error))
        }
      })
      .catch(error => reject(error))
  })
}

export function createRoom(userId) {
  return new Promise((resolve, reject) => {
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
          .then(() => resolve(transformRoomFromDatabase(room)))
          .catch(error => resolve(error))
      })
      .catch(error => reject(error))
  })
}

export function getAllRooms() {
  // return database.raw(`
  //   SELECT to_jsonb(rooms) || jsonb_build_object('members', members) AS rooms
  //   FROM rooms
  //   LEFT JOIN (
  //      SELECT room_id AS id, jsonb_agg(members) AS "members"
  //      FROM (
  //          SELECT room_id, id, username, active
  //          FROM room_members
  //          INNER JOIN users ON users.id = room_members.user_id
  //      ) AS members
  //      GROUP BY 1
  //   ) room_members USING (id);
  // `)
  return new Promise((resolve, reject) => {
    database
      .select('rooms.*', 'users.username', 'members')
      .from('rooms')
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
      .catch(error => reject(error))
  })
}

/*
SELECT rooms.*, members.member_ids
   FROM rooms
   LEFT JOIN LATERAL (
      SELECT ARRAY (
         SELECT to_jsonb(members)
         FROM (
             SELECT room_id, id, username, active
             FROM room_members
             INNER JOIN users ON users.id = room_members.user_id
             ) AS members
         WHERE  room_id = rooms.id
         ) AS member_ids
      ) members ON true;
*/

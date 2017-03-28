import database from '../../database'

export function connectRoomWithMember(roomId, userId) {
  return database('room_members').insert({
    room_id: roomId,
    user_id: userId,
    active: true,
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
        console.log(room, room.id)
        connectRoomWithMember(room.id, userId)
          .then(() => resolve({ roomId: room.id, room }))
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
  return database
    .select('rooms.*', 'members').from('rooms').joinRaw(database.raw(`
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

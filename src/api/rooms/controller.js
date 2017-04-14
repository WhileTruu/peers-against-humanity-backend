import { Router } from 'express'

import { joinRoom, exitRoom, createRoom, getRoomMembers, getAllRooms, setRoomFinished } from './repository'
import logger from '../../logger'
import { verifyAuthorization } from '../authorizationService'
import { socketServer } from '../../'

const router = new Router()

function respond(response) {
  return ({
    status: code => ({
      error: (message) => {
        logger.error(message)
        response.status(code).send(message)
      },
    }),
  })
}

router.put('/:roomId/members/:memberId', verifyAuthorization, (request, response) => {
  const userId = response.locals.userId
  const { roomId, memberId } = request.params
  if (userId !== parseInt(memberId, 10)) {
    response.status(403).send()
  } else {
    joinRoom(roomId, userId)
      .then((room) => {
        response.status(200).json(room)
        socketServer.broadcastMembers(room.id)
      })
      .catch(error => respond(response).status(500).error(error))
  }
})

router.delete('/:roomId/members/:memberId', verifyAuthorization, (request, response) => {
  const userId = response.locals.userId
  const { roomId, memberId } = request.params
  if (userId !== parseInt(memberId, 10)) {
    response.status(403).send()
  } else {
    exitRoom(userId)
      .then(() => {
        response.status(200).send()
        socketServer.broadcastRoomUpdate(roomId)
        socketServer.broadcastMembers(roomId)
      })
      .catch(error => respond(response).status(500).error(error))
  }
})

router.post('/', verifyAuthorization, (request, response) => {
  const userId = response.locals.userId
  createRoom(userId)
    .then((room) => {
      response.status(200).json(room)
      socketServer.broadcastRoomUpdate(room.id)
    })
    .catch(error => respond(response).status(500).error(error))
})

router.get('/', (request, response) => {
  getAllRooms()
    .then(room => response.status(200).json(room))
    .catch(error => respond(response).status(500).error(error))
})

// TODO: re-add authorization verification
router.get('/:roomId/members', (request, response) => {
  const { roomId } = request.params
  getRoomMembers(roomId)
    .then(members => response.status(200).json(members))
    .catch(error => respond(response).status(500).error(error))
})

router.delete('/:roomId', (request, response) => {
  const { roomId } = request.params
  setRoomFinished(roomId)
    .then(() => response.status(200).send())
    .catch(error => respond(response).status(500).error(error))
})

export default router

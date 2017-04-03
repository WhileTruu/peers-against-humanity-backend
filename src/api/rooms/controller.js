import { Router } from 'express'

import { joinRoom, getRoomById, exitRoom, createRoom } from './repository'
import logger from '../../logger'
import { verifyAuthorization } from '../authorizationService'
import { webSocketServer } from '../../'

const router = new Router()

router.put('/:id/join', verifyAuthorization, (request, response) => {
  const userId = response.locals.userId
  const roomId = request.params.id
  joinRoom(roomId, userId)
    .then(() => {
      getRoomById(roomId)
        .then((room) => {
          response.status(200).json(room)
          webSocketServer.broadcast({ type: 'UPDATE_ROOM', room })
        })
        .catch((error) => {
          logger.error(error.message)
          response.status(500).send()
        })
    })
    .catch((error) => {
      logger.error(error.message)
      response.status(500).send()
    })
})

router.put('/:id/exit', verifyAuthorization, (request, response) => {
  const userId = response.locals.userId
  const roomId = request.params.id
  exitRoom(userId)
    .then((room) => {
      response.status(200).json(room)
      webSocketServer.broadcastRoomUpdate(roomId)
    })
    .catch((error) => {
      logger.error(error.message)
      response.status(500).send()
    })
})

router.post('/new', verifyAuthorization, (request, response) => {
  const userId = response.locals.userId
  createRoom(userId)
    .then((id) => {
      getRoomById(id)
        .then((room) => {
          response.status(200).json(room)
          webSocketServer.broadcast({ type: 'UPDATE_ROOM', room })
        })
        .catch((error) => {
          logger.error(error.message)
          response.status(500).send()
        })
    })
    .catch((error) => {
      logger.error(error.message)
    })
})

export default router

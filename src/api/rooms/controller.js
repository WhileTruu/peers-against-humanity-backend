import { Router } from 'express'

import { joinRoom, getRoomById, exitRoom, createRoom } from './repository'
import logger from '../../logger'
import { verifyAuthorization } from '../authorizationService'
import { webSocketServer } from '../../'

const router = new Router()

router.put('/:roomId/members/:memberId', verifyAuthorization, (request, response) => {
  const userId = response.locals.userId
  const { roomId, memberId } = request.params
  if (userId !== parseInt(memberId, 10)) {
    response.status(403).send()
  } else {
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
        webSocketServer.broadcastRoomUpdate(roomId)
      })
      .catch((error) => {
        logger.error(error.message)
        response.status(500).send()
      })
  }
})

router.post('/', verifyAuthorization, (request, response) => {
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

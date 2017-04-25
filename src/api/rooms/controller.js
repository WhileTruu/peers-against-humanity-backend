import { Router } from 'express'

import * as repository from './repository'
import { verifyAuthorization as verifyAuth } from '../authorizationService'
import { socketServer } from '../../'

const router = new Router()

function verifyRoomId(request, response, next) {
  const { roomId } = request.params
  if (!parseInt(roomId, 10)) return response.status(400).send()
  return next()
}

function getRoomById(request, response) {
  const { roomId } = request.params
  return repository.getRoomByID(roomId)
    .then(members => response.status(200).json(members))
    .catch(error => response.status(500).send(error.toString()))
}

function joinRoom(request, response) {
  const userId = response.locals.userId
  const { roomId } = request.params
  return repository.getRoomById(roomId)
    .then((room) => {
      if (!room.active) return response.status(400).send()
      socketServer.joinRoom(room.ownerId, userId)
      return response.status(200).json(room)
    })
    .catch(error => response.status(500).send(error.toString()))
}

function exitRoom(request, response) {
  const userId = response.locals.userId
  const { roomId } = request.params
  repository.exitRoom(roomId, userId)
    .then((room) => {
      if (room) {
        socketServer.broadcastRoomUpdate(room)
        return response.status(200).send()
      }
      return response.status(400).send()
    })
    .catch(error => response.status(500).send(error.toString()))
}

function createRoom(request, response) {
  const userId = response.locals.userId
  repository.createRoom(userId)
    .then((room) => {
      socketServer.broadcastRoomUpdate(room)
      return response.status(200).json(room)
    })
    .catch(error => response.status(500).send(error.toString()))
}

function getRooms(request, response) {
  repository.getRooms()
    .then(rooms => response.status(200).json(rooms))
    .catch(error => response.status(500).send(error.toString()))
}

router.get('/:roomId', verifyAuth, verifyRoomId, getRoomById)
router.put('/:roomId', verifyAuth, verifyRoomId, joinRoom)
router.delete('/:roomId', verifyAuth, verifyRoomId, exitRoom)
router.post('/', verifyAuth, createRoom)
router.get('/', getRooms)

export default router

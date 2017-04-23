import { Router } from 'express'

import * as repository from './repository'
import { verifyAuthorization as verifyAuth } from '../authorizationService'
import { socketServer } from '../../'

const router = new Router()

function verifyMemberId(request, response, next) {
  const userId = response.locals.userId
  const { memberId } = request.params
  if (userId !== parseInt(memberId, 10)) response.status(400).send()
  return next()
}

function verifyRoomId(request, response, next) {
  const { roomId } = request.params
  if (!parseInt(roomId, 10)) return response.status(400).send()
  return next()
}

function getRoomMembers(request, response) {
  const { roomId } = request.params
  return repository.getRoomMembers(roomId)
    .then(members => response.status(200).json(members))
    .catch(error => response.status(500).send(error.toString()))
}

function joinRoom(request, response) {
  const { roomId, memberId } = request.params
  return repository.joinRoom(roomId, memberId)
    .then((room) => {
      // repository.getRoomById(room.id).then(console.log).catch(console.log)
      socketServer.broadcastMembers(room.id)
      return response.status(200).json(room)
    })
    .catch(error => response.status(500).send(error.toString()))
}

function exitRoom(request, response) {
  const { roomId, memberId } = request.params
  repository.exitRoom(roomId, memberId)
    .then((exitedRoomId) => {
      socketServer.broadcastRoomUpdate(exitedRoomId)
      socketServer.broadcastMembers(exitedRoomId)
      // repository.getRoomById(exitedRoomId).then(console.log).catch(console.log)
      return response.status(200).send()
    })
    .catch(error => response.status(500).send(error.toString()))
}

function createRoom(request, response) {
  const userId = response.locals.userId
  repository.createRoom(userId)
    .then((room) => {
      socketServer.broadcastRoomUpdate(room.id)
      // repository.getRoomById(room.id).then(console.log).catch(console.log)
      return response.status(200).json(room)
    })
    .catch(error => response.status(500).send(error.toString()))
}

function getRooms(request, response) {
  repository.getRooms()
    .then(room => response.status(200).json(room))
    .catch(error => response.status(500).send(error.toString()))
}

router.get('/:roomId/members', verifyAuth, verifyRoomId, getRoomMembers)
router.put('/:roomId/members/:memberId', verifyAuth, verifyRoomId, verifyMemberId, joinRoom)
router.delete('/:roomId/members/:memberId', verifyAuth, verifyRoomId, verifyMemberId, exitRoom)

router.post('/', verifyAuth, createRoom)
router.get('/', getRooms)

export default router

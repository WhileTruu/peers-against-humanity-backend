import WebSocket from 'ws'

import * as repository from './repository'

import logger from '../../logger'
import { verifyToken } from '../authorizationService'
import { RoomsException } from '../errors'

export default class WebSocketServer {
  constructor({ server, path }) {
    this.webSocketServer = new WebSocket.Server({ server, path })
    logger.info('WS server running')
    this.webSocketServer.on('connection', client => this.onConnection(client))
  }

  onConnection(client) {
    logger.info('New client connected to WS.')
    this.sendAllRoomsToClient(client)
    client.on('close', () => {
      if (client.userId) this.exitRoom(null, client.userId)
    })
    client.on('message', (message) => {
      const data = JSON.parse(message)
      if (!client.userId && data.type !== '@socket/AUTHENTICATE') {
        client.close()
        return
      }
      switch (data.type) {

        case '@socket/AUTHENTICATE': {
          const clientVerification = verifyToken(data.token)
          if (!clientVerification.authorization) {
            logger.ws.info('@socket/NOT_AUTHENTICATED').from('server').to('anon')
            client.send(JSON.stringify({ type: '@socket/NOT_AUTHENTICATED' }))
            client.close()
            break
          }

          if (this.isDuplicateConnection(clientVerification.userId)) {
            logger.ws.info('NOT_@socket/AUTHENTICATED').from('server').to(clientVerification.userId)
            client.send(JSON.stringify({ type: '@socket/NOT_AUTHENTICATED' }))
            client.close()
          } else {
            client.userId = clientVerification.userId // eslint-disable-line
            logger.ws.info('@socket/AUTHENTICATED').from('server').to(clientVerification.userId)
            client.send(JSON.stringify({ type: '@socket/AUTHENTICATED' }))
          }
          break
        }

        case '@dataChannel/OFFER':
          logger.ws.info('@dataChannel/OFFER').from(client.userId).to(data.to)
          this.broadcastToClients([parseInt(data.to, 10)], { ...data })
          break

        case '@dataChannel/ANSWER':
          logger.ws.info('@dataChannel/ANSWER').from(client.userId).to(data.to)
          this.broadcastToClients([parseInt(data.to, 10)], { ...data })
          break

        case '@dataChannel/ICE_CANDIDATE':
          logger.ws.info('@dataChannel/ICE_CANDIDATE').from(client.userId).to(data.to)
          this.broadcastToClients([parseInt(data.to, 10)], { ...data })
          break

        case '@rooms/CREATE_ROOM':
          logger.ws.info('@rooms/CREATE_ROOM').from(client.userId).to('server')
          this.createRoom(client)
          break

        case '@rooms/JOIN_ROOM':
          logger.ws.info(`@rooms/TRY_JOIN_ROOM ${data.id}`).from(client.userId).to('?')
          this.joinRoom(data.id, client)
          break

        case '@rooms/EXIT_ROOM':
          logger.ws.info(`@rooms/EXIT_ROOM ${data.id}`).from(client.userId).to('server')
          this.exitRoom(data.id, client.userId)
          break

        case '@socket/TAKE_OVER_ROOM':
          logger.ws.info(`@socket/TAKE_OVER_ROOM ${data.id}`).from(client.userId).to('server')
          this.takeOverRoom(data.id, client.userId)
          break

        case '@rooms/JOIN_DENIED':
          logger.ws.info(`@rooms/JOIN_DENIED ${data.id}`).from(client.userId).to(data.to)
          this.broadcastToClients([parseInt(data.to, 10)], { ...data })
          break

        default:
          break
      }
    })
  }

  broadcastRoomUpdate(room) {
    this.broadcast({ type: '@rooms/UPDATE_ROOM', room })
  }

  isDuplicateConnection(clientId) {
    for (let client of this.webSocketServer.clients) { // eslint-disable-line
      if (client.userId === clientId) return true
    }
    return false
  }

  sendAllRoomsToClient(client) { // eslint-disable-line class-methods-use-this
    repository.getRooms()
      .then(rooms => (
        client.send(JSON.stringify({ type: '@rooms/UPDATE_ROOMS', rooms }))
      ))
      .catch(error => logger.error(error.message))
  }

  broadcastToClients(listOfClientIds, data) {
    this.webSocketServer.clients.forEach((client) => {
      if (listOfClientIds.includes(client.userId) && client.readyState === client.OPEN) {
        client.send(JSON.stringify(data))
      }
    })
  }

  broadcast(data) {
    this.webSocketServer.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(data))
      }
    })
  }

  exitRoom(roomId, userId) {
    repository.exitRoom(roomId, userId)
      .then((room) => {
        if (room) {
          logger.ws.info(`@rooms/EXITED_ROOM ${room.id}`).from('server').to(userId)
          this.broadcastRoomUpdate(room)
        }
      })
      .catch(error => logger.ws.error(error.toString()).from(userId))
  }

  takeOverRoom(roomId, userId) {
    repository.takeOverRoom(roomId, userId)
      .then((room) => {
        if (room) {
          logger.ws.info(`@socket/TOOK_OVER_ROOM ${room.id}`).from('server').to(userId)
          this.broadcastRoomUpdate(room)
        }
      })
      .catch(error => logger.ws.error(error.toString()).from(userId))
  }

  joinRoom(roomId, client) {
    return repository.getRoomById(roomId)
      .then((room) => {
        if (!room.active) {
          throw new RoomsException('Room you are trying to join is not active.')
        } else {
          logger.ws.info(`@rooms/JOIN_ROOM ${roomId}`).from(client.userId).to(room.ownerId)
          this.broadcastToClients([parseInt(room.ownerId, 10)], {
            type: '@rooms/JOIN_ROOM', from: client.userId, to: room.ownerId,
          })
        }
      })
      .catch(error => client.send(JSON.stringify({
        type: '@rooms/ROOM_NOT_JOINED', error: error.toString(), from: -1337, to: client.userId,
      })))
  }

  createRoom(client) { // eslint-disable-line
    repository.createRoom(client.userId)
      .then((room) => {
        logger.ws.info(`@rooms/CREATED_ROOM ${room.id}`).from('server').to(client.userId)
        client.send(JSON.stringify({ type: '@rooms/CREATED_ROOM', room }))
        this.broadcast({ type: '@rooms/UPDATE_ROOM', room })
      })
      .catch(error => client.send(JSON.stringify({ type: '@rooms/ROOM_NOT_CREATED', error: error.toString() })))
  }
}

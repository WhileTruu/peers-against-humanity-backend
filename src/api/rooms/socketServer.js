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
      if (!client.userId) return
      // TODO: Don't throw an error if not room owner.
      repository.exitRoom(null, client.userId)
        .then((room) => { if (room) this.broadcastRoomUpdate(room) })
        .catch(error => logger.error(error.toString()))
    })
    client.on('message', (message) => {
      const data = JSON.parse(message)
      logger.ws.info(data.type).from(client.userId ? client.userId : 'unknown')
      if (!client.userId && data.type !== 'AUTHENTICATE') {
        client.close()
        return
      }
      switch (data.type) {

        case 'AUTHENTICATE': {
          const clientVerification = verifyToken(data.token)
          if (!clientVerification.authorization) {
            client.send(JSON.stringify({ type: 'NOT_AUTHENTICATED' }))
            client.close()
            break
          }
          client.userId = clientVerification.userId // eslint-disable-line
          this.closeDuplicateClientConnection(clientVerification.userId, client)
          client.send(JSON.stringify({ type: 'AUTHENTICATED' }))
          break
        }

        case 'PEER_CONNECTION_OFFER':
          this.broadcastToClients([parseInt(data.to, 10)], { ...data })
          break

        case 'PEER_CONNECTION_ANSWER':
          this.broadcastToClients([parseInt(data.to, 10)], { ...data })
          break

        case 'ICE_CANDIDATE':
          this.broadcastToClients([parseInt(data.to, 10)], { ...data })
          break

        case 'CREATE_ROOM':
          this.createRoom(client)
          break

        case 'JOIN_ROOM':
          this.joinRoom(data.id, client)
          break

        case 'EXIT_ROOM':
          this.exitRoom(data.id, client)
          break

        default:
          break
      }
    })
  }

  broadcastRoomUpdate(room) {
    this.broadcast({ type: 'UPDATE_ROOM', room })
  }

  closeDuplicateClientConnection(id, newClient) {
    this.webSocketServer.clients.forEach((client) => {
      if (client.userId === id && client !== newClient) newClient.close()
    })
  }

  sendAllRoomsToClient(client) { // eslint-disable-line class-methods-use-this
    repository.getRooms()
      .then(rooms => (
        client.send(JSON.stringify({ type: 'UPDATE_ROOMS', rooms }))
      ))
      .catch(error => logger.error(error.message))
  }

  broadcastToClients(listOfClientIds, data) {
    this.webSocketServer.clients.forEach((client) => {
      if (listOfClientIds.includes(client.userId) && client.readyState === client.OPEN) {
        logger.ws.info(data.type).to(client.userId)
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

  exitRoom(roomId, client) {
    const exitRoom = () => repository.exitRoom(roomId, client.userId)
      .then((exitedRoom) => {
        if (exitedRoom) {
          this.broadcastRoomUpdate(exitedRoom)
          if (roomId) client.send(JSON.stringify({ type: 'EXITED_ROOM' }))
        } else if (roomId) {
          client.send(JSON.stringify({ type: 'ROOM_NOT_EXITED' }))
        }
      })
      .catch(error => client.send(JSON.stringify({ type: 'ROOM_NOT_EXITED', error: error.toString() })))
    if (!roomId) exitRoom()
    return repository.getRoomById(roomId)
      .then((room) => {
        if (client.userId === room.ownerId) exitRoom()
      })
  }

  joinRoom(roomId, client) {
    return repository.getRoomById(roomId)
      .then((room) => {
        if (!room.active) {
          throw new RoomsException('Room you are trying to join is not active.')
        } else {
          this.broadcastToClients([parseInt(room.ownerId, 10)], {
            type: 'NEW_MEMBER', from: client.userId, to: room.ownerId,
          })
        }
      })
      .catch(error => client.send(JSON.stringify({
        type: 'ROOM_NOT_JOINED', error: error.toString(), from: -1337, to: client.userId,
      })))
  }

  createRoom(client) { // eslint-disable-line
    repository.createRoom(client.userId)
      .then((room) => {
        client.send(JSON.stringify({ type: 'CREATED_ROOM', room }))
        this.broadcast({ type: 'UPDATE_ROOM', room })
      })
      .catch(error => client.send(JSON.stringify({ type: 'ROOM_NOT_CREATED', error: error.toString() })))
  }
}

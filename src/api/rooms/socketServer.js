import WebSocket from 'ws'

import { getAllRooms, getRoomById, exitRoom, getRoomMembers } from './repository'

import logger from '../../logger'
import { verifyToken } from '../authorizationService'

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
      exitRoom(client.userId)
        .then(([room]) => {
          if (room) {
            this.broadcastRoomUpdate(room.id)
            this.broadcastMembers(room.id)
          }
        })
        .catch(error => logger.error(error.toString()))
    })
    client.on('message', (message) => {
      const data = JSON.parse(message)
      switch (data.type) {
        case 'VERIFY': {
          const clientVerification = verifyToken(data.token)
          if (!clientVerification.authorization) {
            client.send(JSON.stringify({ type: 'NOT_VERIFIED' }))
            client.close()
            break
          }
          client.userId = clientVerification.userId // eslint-disable-line
          this.closeDuplicateClientConnection(clientVerification.userId, client)
          client.send(JSON.stringify({ type: 'VERIFIED' }))
          break
        }
        case 'PEER_CONNECTION_OFFER': {
          this.sendToClient(data.peerId, { ...data, peerId: client.userId })
          break
        }
        case 'PEER_CONNECTION_ANSWER': {
          this.sendToClient(data.peerId, { ...data, peerId: client.userId })
          break
        }
        case 'ICE_CANDIDATE': {
          this.sendToClient(data.peerId, { ...data, peerId: client.userId })
          break
        }
        default:
          break
      }
    })
  }

  closeDuplicateClientConnection(id, newClient) {
    this.webSocketServer.clients.forEach((client) => {
      if (client.userId === id && client !== newClient) newClient.close()
    })
  }

  broadcastRoomUpdate(id) {
    getRoomById(id)
      .then(room => (this.broadcast({ type: 'UPDATE_LIST_ROOM', room })))
      .catch(error => logger.error(error.message))
  }

  sendAllRoomsToClient(client) { // eslint-disable-line class-methods-use-this
    getAllRooms()
      .then(rooms => (
        client.send(JSON.stringify({ type: 'UPDATE_LIST_ROOMS', rooms }))
      ))
      .catch(error => logger.error(error.message))
  }

  broadcastMembers(roomId) { // eslint-disable-line class-methods-use-this
    getRoomMembers(roomId)
      .then((members) => {
        this.broadcastToClients(Object.keys(members).map(key => parseInt(key, 10)), {
          type: 'UPDATE_ROOM_MEMBERS',
          members,
        })
      })
      .catch(error => logger.error(error.message))
  }

  broadcastToClients(listOfClientIds, data) {
    this.webSocketServer.clients.forEach((client) => {
      if (listOfClientIds.includes(client.userId) && client.readyState === client.OPEN) {
        client.send(JSON.stringify(data))
      }
    })
  }

  sendToClient(clientId, data) {
    this.webSocketServer.clients.forEach((client) => {
      if (client.userId === parseInt(clientId, 10) && client.readyState === client.OPEN) {
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
}

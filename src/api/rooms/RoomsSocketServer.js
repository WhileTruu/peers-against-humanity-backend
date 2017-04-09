import WebSocket from 'ws'

import { getAllRooms, getRoomById, exitRoom } from './repository'
import { Client, Room } from './GameRoom' // eslint-disable-line

import logger from '../../logger'
import { verifyToken } from '../authorizationService'

const UPDATE_ROOM = 'UPDATE_ROOM'
const UPDATE_ROOMS = 'UPDATE_ROOMS'

// export function getRandomName() {
//   return Math.random().toString(36).substring(2, 6).toUpperCase()
// }

export default class WebSocketServer {
  constructor({ server, path }) {
    this.webSocketServer = new WebSocket.Server({ server, path })
    logger.info('WS server running')
    this.webSocketServer.on('connection', client => this.onConnection(client))
  }

  onConnection(client) {
    logger.info('New client connected to WS.')
    const clientVerification = verifyToken(client.upgradeReq.headers['sec-websocket-protocol'])
    if (!clientVerification.authorization) client.close()
    client.userId = clientVerification.userId // eslint-disable-line no-param-reassign
    this.closeDuplicateClientConnection(clientVerification.userId, client)
    this.sendAllRoomsToClient(client)
    client.on('close', () => {
      exitRoom(client.userId)
        .then((result) => {
          if (result) this.broadcastRoomUpdate(result[0].id)
        })
        .catch(error => logger.error(error))
    })
    client.on('message', (message) => {
      const data = JSON.parse(message)
      switch (data.type) {
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
      .then(room => (this.broadcast({ type: UPDATE_ROOM, room })))
      .catch(error => logger.error(error.message))
  }

  sendAllRoomsToClient(client) { // eslint-disable-line class-methods-use-this
    getAllRooms()
      .then(availableRooms => (
        client.send(JSON.stringify({ type: UPDATE_ROOMS, availableRooms }))
      ))
      .catch(error => logger.error(error.message))
  }

  sendToClient(clientId, data) {
    this.webSocketServer.clients.forEach((client) => {
      // console.log(client.userId, clientId, client.userId === clientId)
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

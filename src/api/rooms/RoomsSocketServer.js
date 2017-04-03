import WebSocket from 'ws'

import { getAllRooms, getRoomById } from './repository'
import { Client, Room } from './GameRoom' // eslint-disable-line

import logger from '../../logger'
import { verifyToken } from '../authorizationService'

const UPDATE_ROOM = 'UPDATE_ROOM'
const UPDATE_AVAILABLE_ROOMS = 'UPDATE_AVAILABLE_ROOMS'

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
        client.send(JSON.stringify({ type: UPDATE_AVAILABLE_ROOMS, availableRooms }))
      ))
      .catch(error => logger.error(error.message))
  }

  broadcast(data) {
    this.webSocketServer.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(data))
      }
    })
  }
}

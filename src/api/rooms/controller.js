import WebSocket from 'ws'

import { Client, Room } from './GameRoom' // eslint-disable-line
import {
  SOCKET_CREATE_ROOM,
  SOCKET_JOIN_ROOM,
  SOCKET_UPDATE_ROOM,
  SOCKET_UPDATE_AVAILABLE_ROOMS,
} from './actions'
import logger from '../../logger'
import { verifyToken } from '../authorizationService'

let room = null
const availableRooms = {}

export function getRandomName() {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

export default class WebSocketServer {
  constructor({ server, path }) {
    this.webSocketServer = new WebSocket.Server({ server, path })
    logger.info('WS server running')
    this.webSocketServer.on('connection', client => this.onConnection(client))
  }

  onConnection(client) {
    logger.info('New client connected to WS.')
    const clientVerification = verifyToken(client.upgradeReq.headers['sec-websocket-protocol'])
    if (clientVerification.authorization) {
      client.userId = clientVerification.userId // eslint-disable-line no-param-reassign
      client.send(JSON.stringify({ type: SOCKET_UPDATE_AVAILABLE_ROOMS, availableRooms }))
      client.on('message', (message) => {
        const data = JSON.parse(message)
        // console.log(data)
        switch (data.type) {
          case SOCKET_CREATE_ROOM: {
            const roomName = getRandomName()
            room = new Room(roomName, new Client(client.userId, data.username))
            availableRooms[roomName] = room
            client.send(JSON.stringify({
              type: SOCKET_UPDATE_ROOM,
              room,
            }))
            this.broadcast(JSON.stringify({
              type: SOCKET_UPDATE_AVAILABLE_ROOMS,
              availableRooms,
            }), client.userId)
            break
          }
          case SOCKET_JOIN_ROOM: {
            room.addMember(new Client(client.userId, data.username))
            client.send(JSON.stringify({
              type: SOCKET_UPDATE_ROOM,
              room,
            }))
            break
          }
          default:
            break
        }
        // this.broadcast(message, client.userId)
      })
    } else {
      logger.info('closed WS client without auth')
      client.close()
    }
  }

  broadcast(data, excludedUserId) {
    this.webSocketServer.clients.forEach((client) => {
      if (client.userId !== excludedUserId && client.readyState === client.OPEN) {
        client.send(data)
      }
    })
  }
}

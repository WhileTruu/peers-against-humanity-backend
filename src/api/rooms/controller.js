import WebSocket from 'ws'

import { Client, Room } from './GameRoom' // eslint-disable-line
import {
  SOCKET_CREATE_ROOM,
  SOCKET_JOIN_ROOM,
  SOCKET_UPDATE_ROOM,
  SOCKET_EXIT_ROOM,
  SOCKET_UPDATE_AVAILABLE_ROOMS,
} from './actions'
import logger from '../../logger'
import { verifyToken } from '../authorizationService'

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
    if (!clientVerification.authorization) client.close()
    client.userId = clientVerification.userId // eslint-disable-line no-param-reassign
    client.send(JSON.stringify({ type: SOCKET_UPDATE_AVAILABLE_ROOMS, availableRooms }))
    client.on('close', () => {
      this.exitFromRoom(client)
    })
    client.on('message', (message) => {
      const data = JSON.parse(message)
      switch (data.type) {
        case SOCKET_CREATE_ROOM: {
          this.createRoom(client, data)
          break
        }
        case SOCKET_EXIT_ROOM: {
          this.exitFromRoom(client)
          break
        }
        case SOCKET_JOIN_ROOM: {
          this.joinRoom(client, data)
          break
        }
        default:
          break
      }
    })
  }

  broadcast(data) {
    this.webSocketServer.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(data)
      }
    })
  }

  exitFromRoom(client) {
    const roomName = client.roomName
    client.roomName = null // eslint-disable-line no-param-reassign
    availableRooms[roomName].removeMember(client.userId)
    if (!availableRooms[roomName].owner) {
      delete availableRooms[roomName]
      this.broadcast(JSON.stringify({ type: SOCKET_UPDATE_AVAILABLE_ROOMS, availableRooms }))
    } else {
      this.broadcast(JSON.stringify({
        type: SOCKET_UPDATE_ROOM,
        room: availableRooms[client.roomName],
      }))
    }
  }

  joinRoom(client, data) {
    availableRooms[data.roomName].addMember(new Client(client.userId, data.username))
    client.roomName = data.roomName // eslint-disable-line no-param-reassign
    this.broadcast(JSON.stringify({
      type: SOCKET_UPDATE_ROOM,
      room: availableRooms[data.roomId],
    }))
  }

  createRoom(client, data) {
    if (!client.roomName) {
      const roomName = getRandomName()
      client.roomName = roomName // eslint-disable-line no-param-reassign
      const room = new Room(roomName, new Client(client.userId, data.username))
      availableRooms[roomName] = room
      this.broadcast(JSON.stringify({
        type: SOCKET_UPDATE_ROOM,
        room,
      }))
    }
  }
}

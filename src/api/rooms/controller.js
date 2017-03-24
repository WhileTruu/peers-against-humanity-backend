import WebSocket from 'ws'

import logger from '../../logger'

export default class WebSocketServer {
  constructor({ server, path }) {
    // const WebSocketServer = WebSocket.Server
    this.webSocketServer = new WebSocket.Server({ server, path })
    logger.info('WS server running')
    this.webSocketServer.on('connection', (client) => {
      logger.info('new WS client')
      client.on('message', (message) => {
        this.broadcast(message, client)
      })
    })
  }

  broadcast(data, exclude) {
    this.webSocketServer.clients.forEach((client) => {
      if (client !== exclude && client.readyState === client.OPEN) client.send(data)
    })
  }
}

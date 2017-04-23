import express from 'express'
import { json } from 'body-parser'
import http from 'http'
import https from 'https'

import logger, { loggingMiddleware } from './logger'
import controller from './api'
import { PORT, getHttpsOptions } from './config'
import SocketServer from './api/rooms'

const app = express()

app.use(json())
app.use(loggingMiddleware())
app.use('/api/v1', controller)
app.set('trust proxy', true)
app.set('trust proxy', 'loopback')

let server = null // eslint-disable-line
let socketServer = null // eslint-disable-line

if (process.env.NODE_ENV === 'development') {
  server = http.createServer(app)
  socketServer = new SocketServer({ server, path: '/api/v1/rooms' })
  server.listen(PORT, () => logger.info(`Server running at ${PORT}`))
} else if (process.env.NODE_ENV === 'production') {
  server = https.createServer(getHttpsOptions(), app)
  socketServer = new SocketServer({ server, path: '/api/v1/rooms' })
  server.listen(PORT, () => logger.info(`Secure server running at ${PORT}`))
}

export { server, socketServer }

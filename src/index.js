import express from 'express'
import { json } from 'body-parser'
import http from 'http'

import logger, { loggingMiddleware } from './logger'
import controller from './api'
import { PORT } from './config'
import SocketServer from './api/rooms'

const app = express()

app.use(json())
app.use(loggingMiddleware())
app.use('/api/v1', controller)

const server = http.createServer(app)
const socketServer = new SocketServer({ server, path: '/api/v1/rooms' }) // eslint-disable-line
server.listen(PORT, () => logger.info(`Server running at ${PORT}`))

export { server, socketServer }

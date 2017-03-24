import express from 'express'
import { json } from 'body-parser'
import http from 'http'

import logger, { loggingMiddleware } from './logger'
import controller from './api'
import { PORT } from './config'
import WebSocketServer from './api/rooms'

const app = express()

app.use(json())
app.use(loggingMiddleware())
app.use('/api/v1', controller)

const server = http.createServer(app)
const webSocketServer = new WebSocketServer({ server, path: '/api/v1/rooms' }) // eslint-disable-line
server.listen(PORT, () => logger.info(`Server running at ${PORT}`))

export default server

import express from 'express'
import { json } from 'body-parser'
import http from 'http'
import https from 'https'
import fs from 'fs'

import logger, { loggingMiddleware } from './logger'
import controller from './api'
import { PORT } from './config'
import SocketServer from './api/rooms'

const app = express()

app.use(json())
app.use(loggingMiddleware())
app.use('/api/v1', controller)

function getSslConfig() {
  return new Promise((resolve, reject) => {
    fs.readFile('/etc/letsencrypt/live/yololo.gq/privkey.pem', (err1, data1) => {
      if (err1) reject(err1)
      fs.readFile('/etc/letsencrypt/live/yololo.gq/fullchain.pem', (err2, data2) => {
        if (err2) reject(err2)
        fs.readFile('/etc/letsencrypt/live/yololo.gq/chain.pem', (err3, data3) => {
          if (err3) reject(err3)
          resolve({ key: data1, cert: data2, ca: data3 })
        })
      })
    })
  })
}
let server = null
let socketServer = null // eslint-disable-line

getSslConfig()
  .then((ssl) => {
    server = https.createServer(ssl, app)
    socketServer = new SocketServer({ server, path: '/api/v1/rooms' }) // eslint-disable-line
    server.listen(PORT, () => logger.info(`Server running at ${PORT}`))
  })
  .catch((error) => {
    console.log(error)
    server = http.createServer(app)
    socketServer = new SocketServer({ server, path: '/api/v1/rooms' }) // eslint-disable-line
    server.listen(PORT, () => logger.info(`Server running at ${PORT}`))
  })

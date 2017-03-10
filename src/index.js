import express from 'express'
import { json } from 'body-parser'
import http from 'http'

import logger, { loggingMiddleware } from './logger'
import controller from './api'
import { PORT } from './config'

const app = express()

// app.use((req, res, next) => {
//   if (req.headers['x-forwarded-proto'] === 'http') {
//     return res.redirect(`https://${req.get('Host')}${req.url}`)
//   }
//   next()
// })

app.use(json())
app.use(loggingMiddleware())
app.use('/api/v1', controller)

const server = http.createServer(app)
server.listen(PORT, () => logger.info(`Server running at ${PORT}`))

export default server

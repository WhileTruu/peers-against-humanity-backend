import { Logger, transports } from 'winston'
import chalk from 'chalk'

const levelColors = {
  ERROR: chalk.bold.red.inverse,
  WARN: chalk.bold.yellow.inverse,
  INFO: chalk.bold.blue.inverse,
}

const winston = new Logger({
  transports: [
    new (transports.Console)({
      formatter(options) {
        const level = options.level.toUpperCase()
        const levelColor = levelColors[level] || (a => a)
        const message = options.message || ''
        return `${levelColor(`[${level}]`)} ${message}`
      },
    }),
  ],
})

const wsString = (type, midMessage, userId) => `\
${chalk.cyan((new Date().toUTCString()))} \
${chalk.red('WS')} \
${chalk.green(type)} \
${chalk.yellow(midMessage)} \
${chalk.blue(userId)}`

const logger = {
  error(message) {
    if (process.env.NODE_ENV !== 'test') winston.error(message)
  },
  info(message) {
    if (process.env.NODE_ENV !== 'test') winston.info(message)
  },
  ws: {
    info(type) {
      return {
        to(userId) { winston.info(wsString(type, 'send to', userId)) },
        from(userId) { winston.info(wsString(type, 'from', userId)) },
      }
    },
    error(type) {
      return {
        to(userId) { winston.info(wsString(type, 'send to', userId)) },
        from(userId) { winston.info(wsString(type, 'from', userId)) },
      }
    },
  },
}

export default logger

export function loggingMiddleware() {
  return (request, response, next) => {
    const startTime = Date.now()
    response.on('finish', () => {
      const duration = Date.now() - startTime
      winston.info(`${chalk.cyan((new Date().toUTCString()))} ${chalk.green(request.method)} ${chalk.blue(request.originalUrl)} ${duration}ms`)
    })
    next()
  }
}

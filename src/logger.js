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

const wsString = (type, from, to) => `\
${chalk.cyan((new Date().toUTCString()))} \
${chalk.red('WS')} \
${chalk.green(type)} \
${chalk.yellow('from')} \
${chalk.blue(from)} \
${chalk.yellow('to')} \
${chalk.blue(to)}`

const logger = {
  error(message) {
    if (process.env.NODE_ENV !== 'test') winston.error(message)
  },
  info(message) {
    if (process.env.NODE_ENV !== 'test') winston.info(message)
  },
  ws: {
    info: type => ({
      from: from => ({
        to: to => winston.info(wsString(type, from, to)),
      }),
    }),
    error: type => ({
      from: from => ({
        to: to => winston.error(wsString(type, from, to)),
      }),
    }),
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

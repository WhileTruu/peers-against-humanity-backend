import { sign as signToken, verify as verifyToken } from 'jsonwebtoken'

import { error } from './util'
import { SECRET } from '../config'

export function createTokenForUser(user) {
  return signToken({ userId: user.id }, SECRET)
}

export function verifyAuthorization(request, response, next) {
  const authHeader = request.get('Authorization')
  if (!authHeader) {
    response.status(403).send(error.MISSING_AUTH_HEADER)
  } else {
    const token = authHeader.replace('Bearer ', '')
    let decoded
    try {
      decoded = verifyToken(token, SECRET)
    } catch (e) {
      response.status(403).send(error.MALFORMED_TOKEN)
    }
    if (decoded) {
      response.locals.userId = decoded.userId // eslint-disable-line no-param-reassign
      next()
    }
  }
}

import { sign as signToken, verify } from 'jsonwebtoken'

import { SECRET } from '../config'

export function createTokenForUser(user) {
  return signToken({ userId: user.id }, SECRET)
}

export function verifyToken(token) {
  let decoded
  try {
    decoded = verify(token, SECRET)
  } catch (e) {
    return { userId: null, authorization: false }
  }
  if (decoded) {
    return { userId: decoded.userId, authorization: true }
  }
  return { userId: null, authorization: false }
}

export function verifyAuthorization(request, response, next) {
  const authHeader = request.get('Authorization')
  if (!authHeader) {
    response.status(403).send()
  } else {
    const token = authHeader.replace('Bearer ', '')
    let decoded
    try {
      decoded = verify(token, SECRET)
    } catch (e) {
      response.status(403).send()
    }
    if (decoded) {
      response.locals.userId = decoded.userId // eslint-disable-line no-param-reassign
      next()
    }
  }
}

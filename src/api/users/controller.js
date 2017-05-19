import { Router } from 'express'
import { hash, compare } from 'bcrypt'

import {
  findById,
  create,
  findByUsername,
  createTemporary,
  makeTemporaryUserPermanent,
} from './repository'
import logger from '../../logger'
import { verifyAuthorization, createTokenForUser as createToken } from '../authorizationService'
import { validateUsernameAndPassword, validateNickname } from '../util'

const router = new Router()

router.get('/:id', verifyAuthorization, (request, response) => {
  if (response.locals.userId !== parseInt(request.params.id, 10)) {
    response.status(403).send()
  } else {
    findById(request.params.id)
      .then(user => response.status(200).json(user))
      .catch((error) => {
        logger.error(error.toString().toString())
        response.status(500).send()
      })
  }
})

router.post('/', validateUsernameAndPassword, (request, response) => {
  const { username = '', password = '' } = request.body
  hash(password, 10)
    .then(hashedPassword => create(username, hashedPassword)
      .then((user) => {
        response.status(201).json({ user, token: createToken({ id: user.id }) })
      })
      .catch((error) => {
        logger.error(error.toString())
        response.status(500).send()
      }))
    .catch((error) => {
      logger.error(error.toString())
      response.status(500).send()
    })
})

router.post('/authentication', validateUsernameAndPassword, (request, response) => {
  const { username = '', password = '' } = request.body
  findByUsername(username)
    .then((user) => {
      if (!user) return response.status(401).send()
      return compare(password, user.password)
        .then((valid) => {
          if (!valid) return response.status(401).send()
          const { password: deletedPassword, ...userWithoutPassword } = user
          return response.status(200).json({
            user: userWithoutPassword,
            token: createToken({ id: user.id }),
          })
        })
        .catch((error) => {
          logger.error(error.toString())
          return response.status(500).send()
        })
    })
    .catch((error) => {
      logger.error(error.toString())
      return response.status(500).send()
    })
})

router.post('/temporary', validateNickname, (request, response) => {
  const { nickname } = request.body
  createTemporary(nickname)
    .then(user => response.status(201).json({ user, token: createToken({ id: user.id }) }))
    .catch((error) => {
      logger.error(error.toString())
      response.status(500).send()
    })
})

router.put('/temporary/:id', verifyAuthorization, validateNickname, validateUsernameAndPassword, (request, response) => {
  const { userId } = response.locals
  if (response.locals.userId !== parseInt(request.params.id, 10)) {
    return response.status(403).send()
  }
  const { nickname, username = '', password = '' } = request.body
  return hash(password, 10)
    .then(hashedPassword => makeTemporaryUserPermanent(userId, nickname, username, hashedPassword)
      .then(user => response.status(201).json({ user, token: createToken({ id: user.id }) }))
      .catch((error) => {
        logger.error(error.toString())
        response.status(500).send()
      }))
    .catch((error) => {
      logger.error(error.toString())
      response.status(500).send()
    })
})


export default router

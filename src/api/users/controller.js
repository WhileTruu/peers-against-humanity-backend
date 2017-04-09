import { Router } from 'express'
import { hash, compare } from 'bcrypt'

import { findById, create, findByUsername } from './repository'
import logger from '../../logger'
import { verifyAuthorization, createTokenForUser } from '../authorizationService'
import { validateUsernameAndPassword } from '../util'

const router = new Router()

router.get('/:id', verifyAuthorization, (request, response) => {
  if (response.locals.userId !== parseInt(request.params.id, 10)) {
    response.status(403).send()
  } else {
    findById(request.params.id)
      .then(user => response.status(200).json(user))
      .catch((error) => {
        logger.error(`users/${request.params.id}: ${error}`)
        response.status(500).send()
      })
  }
})

router.post('/', validateUsernameAndPassword, (request, response) => {
  const { username = '', password = '' } = request.body
  hash(password, 10)
    .then(hashedPassword => create(username, hashedPassword)
      .then((result) => {
        const id = result[0]
        response.status(201).json({ username, id, token: createTokenForUser({ id }) })
      })
      .catch((error) => {
        logger.error(`User registration: ${error}`)
        response.status(500).send()
      }))
    .catch((error) => {
      logger.error(`User registration: ${error}`)
      response.status(500).send()
    })
})

router.post('/authentication', validateUsernameAndPassword, (request, response) => {
  const { username = '', password = '' } = request.body
  findByUsername(username)
    .then((authorization) => {
      if (!authorization) {
        response.status(403).send()
      } else {
        compare(password, authorization.password)
          .then((valid) => {
            if (!valid) {
              response.status(403).send()
            } else {
              const { id } = authorization
              response.status(200).json({ username, id, token: createTokenForUser({ id }) })
            }
          })
          .catch((error) => {
            logger.error(`users/authentication: ${error}`)
            response.status(500).send()
          })
      }
    })
    .catch((error) => {
      logger.error(`users/authentication: ${error}`)
      response.status(500).send()
    })
})


export default router

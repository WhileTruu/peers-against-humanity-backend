import { Router } from 'express'
import { compare } from 'bcrypt'

import { findByUsername } from '../repository'
import { error as errorMessage, validateUsernameAndPassword } from '../../util'
import logger from '../../../logger'
import {
  createTokenForUser,
} from '../../authorizationService'

const router = new Router()

router.post('/', validateUsernameAndPassword, (request, response) => {
  const { username = '', plainTextPassword = '' } = request.body
  findByUsername(username)
    .then((authorization) => {
      if (!authorization) {
        response.status(400).send(errorMessage.INVALID_USERNAME)
      } else {
        compare(plainTextPassword, authorization.password)
          .then((valid) => {
            if (!valid) {
              response.status(400).send(errorMessage.INVALID_USERNAME_OR_PASSWORD)
            } else {
              const { id } = authorization
              response.status(200).json({ token: createTokenForUser({ id }) })
            }
          })
          .catch((error) => {
            logger.error(`users/authentication: ${error}`)
            response.status(500).send(errorMessage.SERVICE_UNAVAILABLE)
          })
      }
    })
    .catch((error) => {
      logger.error(`users/authentication: ${error}`)
      response.status(500).send(errorMessage.SERVICE_UNAVAILABLE)
    })
})

export default router

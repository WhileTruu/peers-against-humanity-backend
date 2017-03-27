import { Router } from 'express'
import { compare } from 'bcrypt'

import { findByUsername } from '../repository'
import { validateUsernameAndPassword } from '../../util'
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
        response.status(400).send()
      } else {
        compare(plainTextPassword, authorization.password)
          .then((valid) => {
            if (!valid) {
              response.status(400).send()
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

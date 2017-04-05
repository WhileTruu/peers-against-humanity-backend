import { Router } from 'express'
import { hash } from 'bcrypt'

import { create } from '../repository'
import { validateUsernameAndPassword } from '../../util'
import logger from '../../../logger'
import {
  createTokenForUser,
} from '../../authorizationService'

const router = new Router()

router.post('/', validateUsernameAndPassword, (request, response) => {
  const { username = '', plainTextPassword = '' } = request.body
  hash(plainTextPassword, 10)
    .then(password => create(username, password)
      .then((result) => {
        const id = result[0]
        response.status(201).json({ username, id, token: createTokenForUser({ id }) })
      })
      .catch((error) => {
        logger.error(`users/registration: ${error}`)
        response.status(500).send()
      }))
    .catch((error) => {
      logger.error(`users/registration: ${error}`)
      response.status(500).send()
    })
})

export default router

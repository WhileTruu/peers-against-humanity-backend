import { Router } from 'express'

import { findById } from './repository'
import { error as errorMessage } from '../util'
import logger from '../../logger'
import {
  verifyAuthorization,
} from '../authorizationService'

import { controller as authenticationController } from './authentication'
import { controller as registrationController } from './registration'

const router = new Router()

router.use('/authentication', authenticationController)
router.use('/registration', registrationController)

router.get('/:id', verifyAuthorization, (request, response) => {
  if (response.locals.userId !== parseInt(request.params.id, 10)) {
    response.status(403).send(errorMessage.ACCESS_DENIED)
  } else {
    findById(request.params.id)
      .then(user => response.status(200).json(user))
      .catch(error => {
        logger.error(`users/${request.params.id}: ${error}`)
        response.status(500).send(errorMessage.SERVICE_UNAVAILABLE)
      })
  }
})

export default router

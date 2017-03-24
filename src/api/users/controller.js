import { Router } from 'express'

import { findById } from './repository'
import logger from '../../logger'
import { verifyAuthorization } from '../authorizationService'
import authenticationController from './authentication'
import registrationController from './registration'

const router = new Router()

router.use('/authentication', authenticationController)
router.use('/registration', registrationController)

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

export default router

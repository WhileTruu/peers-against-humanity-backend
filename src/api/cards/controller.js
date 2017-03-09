import { Router } from 'express'

import {
  findById,
  getAllCards,
  createNewCard,
  getRandomCard,
  upVote,
  downVote,
} from './repository'
import { error as errorMessage } from '../util'
import validateCardData from './validationService'
import { verifyAuthorization } from '../authorizationService'

import logger from '../../logger'

const router = new Router()

router.get('/all', (request, response) => {
  getAllCards()
    .then(cards => response.status(200).json(cards))
    .catch((error) => {
      logger.error(error.message)
      response.status(500).json({ message: error.message })
    })
})

router.get('/random', (request, response) => {
  getRandomCard()
    .then(card => response.status(200).json(card))
    .catch((error) => {
      logger.error(error.message)
      response.status(500).json({ message: error.message })
    })
})

router.post('/new', verifyAuthorization, validateCardData, (request, response) => {
  const { languageId, colorId, pickCount, text, category } = request.body
  const { userId, categoryId } = response.locals

  createNewCard({ languageId, colorId, pickCount, text, category, userId }, categoryId)
    .then((result) => {
      response.status(201).json(result)
    })
    .catch((error) => {
      logger.error(`cards/new: ${error}`)
      response.status(500).send(errorMessage.SERVICE_UNAVAILABLE)
    })
})

router.post('/:id/vote/up', verifyAuthorization, (request, response) => {
  const userId = response.locals.userId
  const cardId = request.params.id
  upVote(cardId, userId)
    .then(result => response.status(200).json(result))
    .catch((error) => {
      logger.error(error.message)
      response.status(500).json({ message: 'Something went wrong with upvoting.' })
    })
})

router.post('/:id/vote/down', verifyAuthorization, (request, response) => {
  const userId = response.locals.userId
  const cardId = request.params.id
  downVote(cardId, userId)
    .then(result => response.status(200).json(result))
    .catch((error) => {
      logger.error(error.message)
      response.status(500).json({ message: 'Something went wrong with downvoting.' })
    })
})

router.get('/:id', (request, response) => {
  findById(request.params.id)
    .then(card => response.status(200).json(card))
    .catch((error) => {
      logger.error(error.message)
      response.status(500).json({ message: error.message })
    })
})

export default router

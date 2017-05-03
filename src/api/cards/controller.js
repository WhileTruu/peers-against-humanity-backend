import { Router } from 'express'

import * as repository from './repository'

function getBlackCards(request, response) {
  const { limit } = request.query
  repository.getBlackCards(limit)
    .then(cards => response.status(200).json(cards))
    .catch(error => response.status(500).send(error))
}

function getWhiteCards(request, response) {
  const { limit } = request.query
  repository.getWhiteCards(limit)
    .then(cards => response.status(200).json(cards))
    .catch(error => response.status(500).send(error))
}

const router = new Router()

router.get('/black', getBlackCards)
router.get('/white', getWhiteCards)

export default router

import { Router } from 'express'

import { findById, getCategories, addCategory } from './repository'
import logger from '../../logger'

const router = new Router()

router.get('/all', (request, response) => {
  getCategories()
    .then(tags => response.status(200).json(tags))
    .catch((error) => {
      logger.error(`categories/all: ${error}`)
      response.status(500).send()
    })
})

router.get('/:id', (request, response) => {
  findById(request.params.id)
    .then(tag => response.status(200).json(tag))
    .catch((error) => {
      logger.error(`categories/${request.params.id}: ${error}`)
      response.status(500).send()
    })
})

router.post('/new', (request, response) => {
  const { name = '' } = request.body
  if (!name.trim()) {
    response.status(400).send()
  } else {
    addCategory(name)
      .then((id) => {
        response.status(201).json({ id: id[0] })
      })
      .catch((error) => {
        logger.error(`categories/new: ${error}`)
        response.status(500).send()
      })
  }
})

export default router

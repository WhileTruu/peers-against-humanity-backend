import { Router } from 'express'
import { controller as usersController } from './users'
import { controller as categoriesController } from './categories'
import { controller as cardsController } from './cards'

const router = new Router()

router.use('/users', usersController)
router.use('/categories', categoriesController)
router.use('/cards', cardsController)

export default router

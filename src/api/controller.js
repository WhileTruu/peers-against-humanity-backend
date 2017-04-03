import { Router } from 'express'
import { controller as usersController } from './users'
import { controller as categoriesController } from './categories'
import { controller as cardsController } from './cards'
import { controller as roomsController } from './rooms'

const router = new Router()

router.use('/users', usersController)
router.use('/categories', categoriesController)
router.use('/cards', cardsController)
router.use('/rooms', roomsController)


export default router

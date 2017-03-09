import { findCardByText } from './repository'
import { findCategoryByName } from '../categories/repository'
import { error as errorMessage } from '../util'
import logger from '../../logger'

const colors = { white: 1, black: 2 }
const languages = { english: 1, estonian: 2 }

function validateText(text) {
  if (text.trim() === '') return false
  if (text.trim().length < 3) return false
  if (text.trim().length > 255) return false
  return true
}

function validateColor(colorId) {
  return colorId === 1 || colorId === 2
}

function validatePickCount(colorId, pickCount) {
  return !pickCount || (colorId === colors.black && pickCount >= 1 && pickCount <= 3)
}

function validateLanguage(languageId) {
  const { english, estonian } = languages
  return (languageId === english || languageId === estonian)
}

export default function validateCardData(request, response, next) {
  const { languageId, colorId, pickCount, text, category } = request.body
  if (
    validateText(text) &&
    validateColor(colorId) &&
    validateLanguage(languageId) &&
    validatePickCount(colorId, pickCount)
  ) {
    findCardByText(text)
      .then((card) => {
        if (!card) {
          findCategoryByName(category)
            .then((foundCategory) => {
              if (foundCategory) {
                /* eslint-disable no-param-reassign */
                response.locals.categoryId = foundCategory.id
                /* eslint-enable no-param-reassign */
                next()
              } else {
                logger.error(`cards/new: no such category exists (${category})`)
                response.status(400).send(errorMessage.BAD_REQUEST)
              }
            })
            .catch((error) => {
              logger.error(`cards/new: ${error}`)
              response.status(400).send(errorMessage.BAD_REQUEST)
            })
        }
      })
      .catch((error) => {
        logger.error(`cards/new: ${error}`)
        response.status(400).send(errorMessage.BAD_REQUEST)
      })
  } else {
    logger.error('cards/new: invalid card data')
    response.status(400).send(errorMessage.BAD_REQUEST)
  }
}

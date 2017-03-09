import {
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
} from './config'

export const error = {
  ACCESS_DENIED: 'ACCESS_DENIED',
  MALFORMED_TOKEN: 'MALFORMED_TOKEN',
  MISSING_AUTH_HEADER: 'MISSING_AUTH_HEADER',
  PASSWORD_ILLEGAL_CHARACTERS: 'USERNAME_ILLEGAL_CHARACTERS',
  USERNAME_ILLEGAL_CHARACTERS: 'USERNAME_ILLEGAL_CHARACTERS',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  MISSING_USERNAME_OR_PASSWORD: 'MISSING_USERNAME_OR_PASSWORD',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  INVALID_USERNAME: 'INVALID_USERNAME',
  MISSING_CATEGORY_NAME: 'MISSING_CATEGORY_NAME',
  BAD_REQUEST: 'BAD_REQUEST',
  CARD_ALREADY_EXISTS: 'CARD_ALREADY_EXISTS',
}

const validationRegex = /^[a-zA-Z0-9]+$/

export function isUsernameValid(username) {
  if (username.length < MIN_USERNAME_LENGTH || username.length > MAX_USERNAME_LENGTH) return false
  if (!username.match(validationRegex)) return false
  return true
}

export function isPasswordValid(password) {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) return false
  if (!password.match(validationRegex)) return false
  return true
}

export function validateUsernameAndPassword(request, response, next) {
  const { username = '', plainTextPassword = '' } = request.body
  if (!username.trim() || !plainTextPassword) {
    response.status(400).send(error.MISSING_USERNAME_OR_PASSWORD)
  } else if (!isUsernameValid(username)) {
    response.status(400).send(error.INVALID_USERNAME)
  } else if (!isPasswordValid(plainTextPassword)) {
    response.status(400).send(error.INVALID_PASSWORD)
  } else {
    next()
  }
}

import {
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
} from './config'

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
  const { username = '', password = '' } = request.body
  if (!username.trim() || !password) {
    response.status(400).send()
  } else if (!isUsernameValid(username)) {
    response.status(400).send()
  } else if (!isPasswordValid(password)) {
    response.status(400).send()
  } else {
    next()
  }
}

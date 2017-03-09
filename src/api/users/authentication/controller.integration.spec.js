import express from 'express'
import request from 'supertest'
import { json } from 'body-parser'

import knex from '../../../database'
import { MAX_USERNAME_LENGTH, MAX_PASSWORD_LENGTH } from '../../config'
import { error } from '../../util'
import controller from '.'

const app = express()
app.use(json())
app.use(controller)

describe('POST /api/v1/users/authentication', () => {
  beforeAll((done) => {
    knex.migrate.rollback()
      .then(() => {
        knex.migrate.latest()
          .then(() => {
            knex.seed.run().then(() => done())
          })
      })
  })

  afterAll((done) => {
    knex.migrate.rollback().then(() => done())
  })

  it('should return user data when info is correct', () => (
    request(app)
      .post('/')
      .send(({ username: 'TheLegend27', plainTextPassword: 'password' }))
      .then((res) => {
        expect(res.status).toBe(200)
        expect(res.body.token).toBeDefined()
      })
  ))

  it('should return error when username missing', () => (
    request(app)
      .post('/')
      .send(({ plainTextPassword: 'password' }))
      .then((res) => {
        expect(res.status).toBe(400)
        expect(res.text).toBe(error.MISSING_USERNAME_OR_PASSWORD)
      })
  ))

  it('should return error when password missing', () => (
    request(app)
      .post('/')
      .send(({ username: 'TheLegend27' }))
      .then((res) => {
        expect(res.status).toBe(400)
        expect(res.text).toBe(error.MISSING_USERNAME_OR_PASSWORD)
      })
  ))

  it('should return error when username too long', () => (
    request(app)
      .post('/')
      .send(({
        username: new Array(MAX_USERNAME_LENGTH + 2).join('c'),
        plainTextPassword: 'password',
      }))
      .then((res) => {
        expect(res.status).toBe(400)
        expect(res.text).toBe(error.INVALID_USERNAME)
      })
  ))

  it('should return error when password too long', () => (
    request(app)
      .post('/')
      .send(({
        username: 'TheLegend27',
        plainTextPassword: new Array(MAX_PASSWORD_LENGTH + 2).join('k'),
      }))
      .then((res) => {
        expect(res.status).toBe(400)
        expect(res.text).toBe(error.INVALID_PASSWORD)
      })
  ))

  it('should return error when username too short', () => (
    request(app)
      .post('/')
      .send(({
        username: 'Th',
        plainTextPassword: 'Wololo',
      }))
      .then((res) => {
        expect(res.status).toBe(400)
        expect(res.text).toBe(error.INVALID_USERNAME)
      })
  ))

  it('should return error when password too short', () => (
    request(app)
      .post('/')
      .send(({
        username: 'TheLegend27',
        plainTextPassword: 'Pa',
      }))
      .then((res) => {
        expect(res.status).toBe(400)
        expect(res.text).toBe(error.INVALID_PASSWORD)
      })
  ))

  it('should respond with status 500 when something is wrong with db', (done) => {
    knex.migrate.rollback()
      .then(() => {
        request(app)
          .post('/')
          .send(({ username: 'DatBoiiiiii', plainTextPassword: 'Owaddup' }))
          .then((res) => {
            expect(res.status).toBe(500)
            expect(res.text).toEqual(error.SERVICE_UNAVAILABLE)
            done()
          })
      })
  })

  it('should return error when username contains weird characters', () => (
    request(app)
      .post('/')
      .send(({
        username: '@@@%%%¤¤¤))(())',
        plainTextPassword: 'Password',
      }))
      .then((res) => {
        expect(res.status).toBe(400)
        expect(res.text).toBe(error.INVALID_USERNAME)
      })
  ))

  it('should return error when password contains weird characters', () => (
    request(app)
      .post('/')
      .send(({
        username: 'TheLegend27',
        plainTextPassword: '@@@%%%¤¤¤))(())',
      }))
      .then((res) => {
        expect(res.status).toBe(400)
        expect(res.text).toBe(error.INVALID_PASSWORD)
      })
  ))
})

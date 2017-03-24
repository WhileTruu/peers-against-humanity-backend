import express from 'express'
import request from 'supertest'
import { json } from 'body-parser'

import knex from '../../../database'
import { MAX_USERNAME_LENGTH, MAX_PASSWORD_LENGTH } from '../../config'
import controller from '.'

const app = express()
app.use(json())
app.use(controller)

describe('POST /api/v1/users/registration', () => {
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

  it('should register and return new user data when info is correct', () => (
    request(app)
      .post('/')
      .send(({ username: 'DatBoiiiiii', plainTextPassword: 'Owaddup' }))
      .then((res) => {
        expect(res.status).toBe(201)
        expect(res.body.username).toBe('DatBoiiiiii')
        expect(res.body.token).toBeDefined()
      })
  ))

  it('should return error when username missing', () => (
    request(app)
      .post('/')
      .send(({ plainTextPassword: 'Owaddup' }))
      .then((res) => {
        expect(res.status).toBe(400)
      })
  ))

  it('should return error when password missing', () => (
    request(app)
      .post('/')
      .send(({ username: 'Owaddup' }))
      .then((res) => {
        expect(res.status).toBe(400)
      })
  ))

  it('should return error when username too long', () => (
    request(app)
      .post('/')
      .send(({
        username: new Array(MAX_USERNAME_LENGTH + 2).join('f'),
        plainTextPassword: 'Owadduuuup',
      }))
      .then((res) => {
        expect(res.status).toBe(400)
      })
  ))

  it('should return error when password too long', () => (
    request(app)
      .post('/')
      .send(({
        username: 'DatBoiiiiii',
        plainTextPassword: new Array(MAX_PASSWORD_LENGTH + 2).join('u'),
      }))
      .then((res) => {
        expect(res.status).toBe(400)
      })
  ))

  it('should return error when username too short', () => (
    request(app)
      .post('/')
      .send(({
        username: 'Da',
        plainTextPassword: 'Owadduuuup',
      }))
      .then((res) => {
        expect(res.status).toBe(400)
      })
  ))

  it('should return error when password too short', () => (
    request(app)
      .post('/')
      .send(({
        username: 'DatBoiiiiii',
        plainTextPassword: 'Ow',
      }))
      .then((res) => {
        expect(res.status).toBe(400)
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
      })
  ))
})

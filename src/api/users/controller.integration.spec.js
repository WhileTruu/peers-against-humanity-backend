import express from 'express'
import request from 'supertest'
import { json } from 'body-parser'
import { hash } from 'bcrypt'

import knex from '../../database'
import { controller } from '.'

const app = express()
app.use(json())
app.use(controller)

describe('GET /api/v1/users/:id', () => {
  beforeAll((done) => {
    knex.migrate.rollback()
      .then(() => {
        knex.migrate.latest()
          .then(() => {
            knex.seed.run()
            hash('password', 10)
              .then(hashedPassword =>
                knex('users')
                  .insert({
                    username: 'TheLegend27',
                    password: hashedPassword,
                  }).then(() => done()),
              )
          })
      })
  })

  afterAll((done) => {
    knex.migrate.rollback().then(() => done())
  })
  it('should receive object for requested user', () => (
    request(app)
      .get('/1')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ4NTkzODI5Mn0.kH3mPmxNoRZJxkkIvJZFENPUP8YHC1vo17zmBw1BwWM')
      .then((res) => {
        expect(res.status).toBe(200)
        expect(res.body.created_at).toBeDefined()
        expect(res.body.id).toBe(1)
        expect(res.body.username).toBeDefined()
        expect(res.body.password).not.toBeDefined()
      })
  ))

  it('should send malformed token error when token is malformed', () => (
    request(app)
      .get('/1')
      .set('Authorization', 'Bearer EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ4NTkzODI5Mn0.kH3mPmxNoRZJxkkIvJZFENPUP8YHC1vo17zmBw1BwWM')
      .then((res) => {
        expect(res.status).toBe(403)
      })
  ))

  it('should send missing auth header error when no auth header specified', () => (
    request(app)
      .get('/1337')
      .then((res) => {
        expect(res.status).toBe(403)
      })
  ))

  it('should deny access when requesting user info that does not belong to you', () => (
    request(app)
      .get('/1337')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ4NTkzODI5Mn0.kH3mPmxNoRZJxkkIvJZFENPUP8YHC1vo17zmBw1BwWM')
      .then((res) => {
        expect(res.status).toBe(403)
      })
  ))

  it('should respond with status 500 when something is wrong with db', (done) => {
    knex.migrate.rollback()
      .then(() => {
        request(app)
          .get('/1')
          .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ4NTkzODI5Mn0.kH3mPmxNoRZJxkkIvJZFENPUP8YHC1vo17zmBw1BwWM')
          .then((res) => {
            expect(res.status).toBe(500)
            done()
          })
      })
  })
})

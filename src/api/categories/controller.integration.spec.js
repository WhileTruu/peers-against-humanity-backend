import express from 'express'
import request from 'supertest'
import { json } from 'body-parser'

import knex from '../../database'

import { controller } from '.'

const app = express()
app.use(json())
app.use(controller)

describe('categories', () => {
  describe('GET /api/v1/categories/:id', () => {
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

    it('should receive object for requested category', () => (
      request(app)
        .get('/1')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ4NTkzODI5Mn0.kH3mPmxNoRZJxkkIvJZFENPUP8YHC1vo17zmBw1BwWM')
        .then((res) => {
          expect(res.status).toBe(200)
          expect(res.body.created_at).toBeDefined()
          expect(res.body.id).toBe(1)
          expect(res.body.name).toBe('A Game of Thrones')
        })
    ))

    it('should return 500 when db not ok', (done) => {
      knex.migrate.rollback()
        .then(() => {
          request(app)
            .get('/1')
            .set('Authorization', 'Bearer EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ4NTkzODI5Mn0.kH3mPmxNoRZJxkkIvJZFENPUP8YHC1vo17zmBw1BwWM')
            .then((res) => {
              expect(res.status).toBe(500)
              done()
            })
        })
    })
  })

  describe('GET /api/v1/categories/all', () => {
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

    it('should receive object for requested category', () => (
      request(app)
        .get('/all')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ4NTkzODI5Mn0.kH3mPmxNoRZJxkkIvJZFENPUP8YHC1vo17zmBw1BwWM')
        .then((res) => {
          expect(res.status).toBe(200)
          expect(res.body).toBeInstanceOf(Array)
        })
    ))

    it('should return 500 when db not ok', (done) => {
      knex.migrate.rollback()
        .then(() => {
          request(app)
            .get('/all')
            .set('Authorization', 'Bearer EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ4NTkzODI5Mn0.kH3mPmxNoRZJxkkIvJZFENPUP8YHC1vo17zmBw1BwWM')
            .then((res) => {
              expect(res.status).toBe(500)
              done()
            })
        })
    })
  })

  describe('GET /api/v1/categories/new', () => {
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

    it('should create a new category', () => (
      request(app)
        .post('/new')
        .send({ name: '1337' })
        .then((res) => {
          expect(res.status).toBe(201)
          expect(res.body.id).toBeDefined()
        })
    ))

    it('should not create a new category when category name not given', () => (
      request(app)
        .post('/new')
        .send({ name: '' })
        .then((res) => {
          expect(res.status).toBe(400)
        })
    ))

    it('should error when db down', (done) => {
      knex.migrate.rollback()
        .then(() => {
          request(app)
            .post('/new')
            .send({ name: '1337' })
            .then((res) => {
              expect(res.status).toBe(500)
              done()
            })
        })
    })
  })
})

import express from 'express'
import request from 'supertest'
import { json } from 'body-parser'

import knex from '../../database'

import { error } from '../util'

const { controller } = require('.')
const app = express()
app.use(json())
app.use(controller)

describe('cards', () => {

  describe('POST /new', () => {
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

    it('should be able to create a new card', () => {
      return request(app)
        .post('/new')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ4NTkzODI5Mn0.kH3mPmxNoRZJxkkIvJZFENPUP8YHC1vo17zmBw1BwWM')
        .send({ languageId: 1, colorId: 1, text: 'YoloHashtag', category: 'Default' })
        .then((res) => {
          expect(res.status).toBe(201)
          expect(res.body.cardId).toBeDefined()
          expect(res.body.categoryId).toBeDefined()
        })
    })

    it('should not be able to create a new card with maleformed token', () => {
      return request(app)
        .post('/new')
        .set('Authorization', 'Bearer EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ4NTkzODI5Mn0.kH3mPmxNoRZJxkkIvJZFENPUP8YHC1vo17zmBw1BwWM')
        .send({ languageId: 1, colorId: 1, text: 'YoloHashtag', category: 'Default' })
        .then((res) => {
          expect(res.status).toBe(403)
          expect(res.text).toBe(error.MALFORMED_TOKEN)
        })
    })

    it('should not be able to create a new card without authorization', () => {
      return request(app)
        .post('/new')
        .send({ languageId: 1, colorId: 1, text: 'YoloHashtag', category: 'Default' })
        .then((res) => {
          expect(res.status).toBe(403)
          expect(res.text).toBe(error.MISSING_AUTH_HEADER)
        })
    })

    it('should not be able to create a new card with faulty data', () => {
      return request(app)
        .post('/new')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ4NTkzODI5Mn0.kH3mPmxNoRZJxkkIvJZFENPUP8YHC1vo17zmBw1BwWM')
        .send({ languageId: 10, colorId: 10, text: 'YoloHashtag', category: 'Defaulto' })
        .then((res) => {
          expect(res.status).toBe(400)
          expect(res.text).toBe(error.BAD_REQUEST)
        })
    })
  })
})

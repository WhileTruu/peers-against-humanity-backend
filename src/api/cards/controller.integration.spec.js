import express from 'express'
import request from 'supertest'
import { json } from 'body-parser'
import { hash } from 'bcrypt'

import knex from '../../database'
import { controller } from '.'

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

    it('should be able to create a new card', () => (
      request(app)
        .post('/new')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ4NTkzODI5Mn0.kH3mPmxNoRZJxkkIvJZFENPUP8YHC1vo17zmBw1BwWM')
        .send({ languageId: 1, colorId: 1, text: 'YoloHashtag', category: 'Default' })
        .then((res) => {
          expect(res.status).toBe(201)
          expect(res.body.cardId).toBeDefined()
          expect(res.body.categoryId).toBeDefined()
        })
    ))

    it('should not be able to create a new card with maleformed token', () => (
      request(app)
        .post('/new')
        .set('Authorization', 'Bearer EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ4NTkzODI5Mn0.kH3mPmxNoRZJxkkIvJZFENPUP8YHC1vo17zmBw1BwWM')
        .send({ languageId: 1, colorId: 1, text: 'YoloHashtag', category: 'Default' })
        .then((res) => {
          expect(res.status).toBe(403)
        })
    ))

    it('should not be able to create a new card without authorization', () => (
      request(app)
        .post('/new')
        .send({ languageId: 1, colorId: 1, text: 'YoloHashtag', category: 'Default' })
        .then((res) => {
          expect(res.status).toBe(403)
        })
    ))

    it('should not be able to create a new card with faulty data', () => (
      request(app)
        .post('/new')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ4NTkzODI5Mn0.kH3mPmxNoRZJxkkIvJZFENPUP8YHC1vo17zmBw1BwWM')
        .send({ languageId: 10, colorId: 10, text: 'YoloHashtag', category: 'Defaulto' })
        .then((res) => {
          expect(res.status).toBe(400)
        })
    ))
  })
})

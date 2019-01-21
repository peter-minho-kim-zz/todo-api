const expect = require('expect')
const request = require('supertest')

const { app } = require('./../server')
const { Card } = require('./../models/card')

beforeEach((done) => {
  Card.remove({}).then(() => done())
})

describe('POST /cards', () => {
  it('should create a new card', (done) => {
    const text = 'Test card text'

    request(app)
      .post('/cards')
      .send({ text })
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text)
      })
      .end((err, res) => {
        if (err) {
          return done(err)
        }

        Card.find().then((cards) => {
          expect(cards.length).toBe(1)
          expect(cards[0].text).toBe(text)
          done()
        }).catch((err) => done(err))
      })
  })

  it('should not create a card with invalid body data', (done) => {
    request(app) 
      .post('/cards')
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err)
        }

        Card.find().then((cards) => {
          expect(cards.length).toBe(0)
          done()
        }).catch((err) => done(err))
      })
  })
})
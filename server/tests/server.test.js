const expect = require('expect')
const request = require('supertest')

const { app } = require('./../server')
const { Card } = require('./../models/card')

const cards = [
  { text: 'first sample card' },
  { text: 'second sample card' }
]

beforeEach((done) => {
  Card.remove({}).then(() => {
    return Card.insertMany(cards)
  }).then(() => done())
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

        Card.find({ text }).then((cards) => {
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
          expect(cards.length).toBe(2)
          done()
        }).catch((err) => done(err))
      })
  })
})

describe('GET /cards', () => {
  it('should get all cards', (done) => {
    request(app)
      .get('/cards')
      .expect(200)
      .expect((res) => {
        expect(res.body.cards.length).toBe(2)
      })
      .end(done)
  })
})
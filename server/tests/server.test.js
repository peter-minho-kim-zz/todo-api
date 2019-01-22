const expect = require('expect')
const request = require('supertest')
const { ObjectID } = require('mongodb')

const { app } = require('./../server')
const { Card } = require('./../models/card')

const cards = [
  { 
    _id: new ObjectID(),
    text: 'first sample card' 
  },
  { 
    _id: new ObjectID(),
    text: 'second sample card' 
  }
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

describe('GET /cards:id', () => {
  it('should return card doc', (done) => {
    request(app)
      .get(`/cards/${cards[0]._id.toHexString()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.card.text).toBe(cards[0].text)
      })
      .end(done)
  })

  it('should return 404 if card not found', (done) => {
    const id = new ObjectID()
    request(app)
      .get(`/cards/${id}`)
      .expect(404)
      .end(done)
  })

  it('should return 404 for non-object ids', (done) => {
    const id = 123
    request(app)
      .get(`/cards/${id}`)
      .expect(404)
      .end(done)
  })
})
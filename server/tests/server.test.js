const expect = require('expect')
const request = require('supertest')
const { ObjectID } = require('mongodb')

const { app } = require('./../server')
const { Card } = require('./../models/card')
const { User } = require('./../models/user')
const { cards, populateCards, users, populateUsers } = require('./seed/seed')

beforeEach(populateUsers)
beforeEach(populateCards)

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

describe('GET /cards/:id', () => {
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

describe('DELETE /cards/:id', () => {
  it('should remove a card', (done) => {
    const id = cards[1]._id.toHexString()

    request(app)
      .delete(`/cards/${id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.card._id).toBe(id)
      })
      .end((err, res) => {
        if (err) {
          return done(err)
        }

        Card.findById(id).then((card) => {
          expect(card).toNotExist()
          done()
        }).catch((err) => done(err))
      })
  })

  it('should return 404 if card not found', (done) => {
    const id = new ObjectID().toHexString()

    request(app)
      .delete(`/cards/${id}`)
      .expect(404)
      .end(done)
  })

  it('should return 404 if object id is invalid', (done) => {
    request(app)
      .delete('/cards/123')
      .expect(404)
      .end(done)
  })
})

describe('PATCH /cards/:id', () => {
  it('should updated the card', (done) => {
    const id = cards[0]._id.toHexString()
    const text = 'This should be the new text'

    request(app)
      .patch(`/cards/${id}`)
      .send({
        completed: true,
        text
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.card.text).toBe(text)
        expect(res.body.card.completed).toBe(true)
        expect(res.body.card.completedAt).toBeA('number')
      })
      .end(done)
  })

  it('should clear completedAt when card is not completed', (done) => {
    const id = cards[1]._id.toHexString()
    const text = 'This should be the new text'

    request(app)
      .patch(`/cards/${id}`)
      .send({
        completed: false,
        text
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.card.text).toBe(text)
        expect(res.body.card.completed).toBe(false)
        expect(res.body.card.completedAt).toNotExist()
      })
      .end(done)
  })
})

describe('GET /users/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(users[0]._id.toHexString())
        expect(res.body.email).toBe(users[0].email)
      })
      .end(done)
  })

  it('should return 401 if not authenticated', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({})
      })
      .end(done)
  })
})

describe('POST /users', () => {
  it('should create a user', (done) => {
    const email = 'test@example.com'
    const password = '123abc!'

    request(app)
      .post('/users')
      .send({ email, password })
      .expect(200)
      .expect((res) => {
        expect(res.header['x-auth']).toExist()
        expect(res.body._id).toExist()
        expect(res.body.email).toBe(email)
      })
      .end((err) => {
        if (err) {
          return done(err)
        }

        User.findOne({ email }).then((user) => {
          expect(user).toExist()
          expect(user.password).toNotBe(password)
          done()
        }).catch((err) => done(err))
      })
  })

  it('should return validation errors if request invalid', (done) => {
    const email = 'test'
    const password = '123'

    request(app)
      .post('/users')
      .send({ email, password })
      .expect(400)
      .end(done)
  })

  it('should not create user if email in use', (done) => {
    const email = 'peter@example.com'
    const password = '123abc!'

    request(app)
      .post('/users')
      .send({ email, password })
      .expect(400)
      .end(done)
  })
})

describe('POST /users/login', () => {
  it('should login user and return auth token', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password
      })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist()
      })
      .end((err, res) => {
        if (err) {
          return done(err)
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens[0]).toInclude({
            access: 'auth',
            token: res.headers['x-auth']
          })
          done()
        }).catch((err) => done(err))
      })
  })

  it('should reject invalid login', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: '123'
      })
      .expect(400)
      .expect((res) => {
        expect(res.headers['x-auth']).toNotExist()
      })
      .end((err, res) => {
        if (err) {
          return done(err)
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens.length).toBe(0)
          done()
        }).catch((err) => done(err))
      })
  })
})

describe('DELETE /users/me/token', () => {
  it('should remove auth token on logout', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err)
        }

        User.findById(users[0]._id).then((user) => {
          expect(user.tokens.length).toBe(0)
          done()
        }).catch((err) => done(err))
      })
  })
})
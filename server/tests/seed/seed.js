const { ObjectID } = require('mongodb')
const jwt = require('jsonwebtoken')

const { Card } = require('./../../models/card')
const { User } = require('./../../models/user')

const userOneId = new ObjectID()
const userTwoId = new ObjectID()

const users = [{
  _id: userOneId,
  email: 'peter@example.com',
  password: 'abc123!',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.JWT_SECRET).toString()
  }]
}, {
  _id: userTwoId,
  email: 'mario@example.com',
  password: 'abc123!',
  tokens: [{
    access: 'auth',
    token: jwt.sign({ _id: userTwoId, access: 'auth' }, process.env.JWT_SECRET).toString()
  }]
}]

const cards = [{
  _id: new ObjectID(),
  text: 'first sample card',
  _creator: userOneId
}, {
  _id: new ObjectID(),
  text: 'second sample card',
  completed: true,
  completedAt: 123,
  _creator: userTwoId
}]

const populateUsers = (done) => {
  User.remove({}).then(() => {
    const userOne = new User(users[0]).save()
    const userTwo = new User(users[1]).save()

    return Promise.all([userOne, userTwo])
  }).then(() => done())
}

const populateCards = (done) => {
  Card.remove({}).then(() => {
    return Card.insertMany(cards)
  }).then(() => done())
}

module.exports = { cards, populateCards, users, populateUsers }
const express = require('express')
const bodyParser = require('body-parser')

const { mongoose } = require('./db/mongoose')
const { Card } = require('./models/card')
const { User } = require('./models/user')

const app = express()

app.use(bodyParser.json())

app.post('/cards', (req, res) => {
  const card = new Card({
    text: req.body.text
  })

  card.save().then((doc) => {
    res.send(doc)
  }, (err) => {
    res.status(400).send(err)
  })
})

app.get('/cards', (req, res) => {
  Card.find().then((cards) => {
    res.send({ cards })
  }, (err) => {
    res.status(400).send(err)
  })
})

app.listen(8080, () => {
  console.log('The magic happens on port 8080')
})

module.exports = { app }
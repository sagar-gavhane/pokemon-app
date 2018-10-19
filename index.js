const express = require('express')
const serverless = require('serverless-http')
const bodyParser = require('body-parser')
const pool = require('./configs/dbConfig')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Handle pokemon GET route for all pokemon
app.get('/pokemon/', (req, res) => {
  const query = 'SELECT * FROM pokemon_tb'
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = { data: null, message: err.message, }
      res.send(response)
    }

    const pokemons = [...results]
    const response = {
      data: pokemons,
      message: 'All pokemons successfully retrieved.',
    }
    res.send(response)
  })
})

// Handle pokemon GET route for specific pokemon
app.get('/pokemon/:id', (req, res) => {
  const id = req.params.id
  const query = `SELECT * FROM pokemon_tb WHERE id=${id}`
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = { data: null, message: err.message, }
      res.send(response)
    }

    const pokemon = results[0]
    const response = {
      data: pokemon,
      message: `Pokemon ${pokemon.name} successfully retrieved.`,
    }
    res.status(200).send(response)
  })
})

// Handle pokemon POST route
app.post('/pokemon/', (req, res) => {
  const { name, height, weight, avatar } = req.body

  const query = `INSERT INTO pokemon_tb (name, height, weight, avatar) VALUES ('${name}', '${height}', '${weight}', '${avatar}')`
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = { data: null, message: err.message, }
      res.send(response)
    }

    const { insertId } = results
    const pokemon = { id: insertId, name, height, weight, avatar }
    const response = {
      data: pokemon,
      message: `Pokemon ${name} successfully added.`,
    }
    res.status(201).send(response)
  })
})

// Handle pokemon PUT route
app.put('/pokemon/:id', (req, res) => {
  const { id } = req.params
  const query = `SELECT * FROM pokemon_tb WHERE id=${id} LIMIT 1`
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = { data: null, message: err.message, }
      res.send(response)
    }

    const { id, name, height, weight, avatar } = { ...results[0], ...req.body }
    const query = `UPDATE pokemon_tb SET name='${name}', height='${height}', weight='${weight}', avatar='${avatar}' WHERE id='${id}'`
    pool.query(query, (err, results, fields) => {
      if (err) {
        const response = { data: null, message: err.message, }
        res.send(response)
      }

      const pokemon = {
        id,
        name,
        height,
        weight,
        avatar,
      }
      const response = {
        data: pokemon,
        message: `Pokemon ${name} is successfully updated.`,
      }
      res.send(response)
    })
  })
})

// Handler pokemon DELETE route
app.delete('/pokemon/:id', (req, res) => {
  const { id } = req.params
  const query = `DELETE FROM pokemon_tb WHERE id=${id}`
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = { data: null, message: err.message }
      res.send(response)
    }

    const response = {
      data: null,
      message: `Pokemon with id: ${id} successfully deleted.`,
    }
    res.send(response)
  })
})

// Handle in-valid route
app.all('*', function(req, res) {
  const response = { data: null, message: 'Route not found!!' }
  res.status(400).send(response)
})

// wrap express app instance with serverless http function
module.exports.handler = serverless(app)

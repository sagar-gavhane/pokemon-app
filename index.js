const express = require('express')
const serverless = require('serverless-http')
const bodyParser = require('body-parser')
const pool = require('./configs/dbConfig')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

// Handle fashion GET route for all fashion
app.get('/fashion/', (req, res) => {
  const query = 'SELECT * FROM fashion_tb'
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = {
        data: null,
        message: err.message,
      }
      res.send(response)
    }

    const fashions = [...results]
    const response = {
      data: fashions,
      message: 'All fashions successfully retrieved.',
    }
    res.send(response)
  })
})

// Handle fasshion GET route for specific fashion
app.get('/fashion/:id', (req, res) => {
  const id = req.params.id
  const query = `SELECT * FROM fashion_tb WHERE id=${id}`
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = {
        data: null,
        message: err.message,
      }
      res.send(response)
    }

    const fashion = results[0]
    const response = {
      data: fashion,
      message: `Fashion ${fashion.name} successfully retrieved.`,
    }
    res.status(200).send(response)
  })
})

// Handle fashion POST route
app.post('/fashion/', (req, res) => {
  const {
    name,
    height,
    weight,
    avatar,
    color
  } = req.body

  const query = `INSERT INTO fashion_tb (name, height, weight, avatar, color) VALUES ('${name}', '${height}', '${weight}', '${avatar}', '$(color)')`
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = {
        data: null,
        message: err.message,
      }
      res.send(response)
    }

    const {
      insertId
    } = results
    const fashion = {
      id: insertId,
      name,
      height,
      weight,
      avatar,
      color
    }
    const response = {
      data: fashion,
      message: `Fashion ${name} successfully added.`,
    }
    res.status(201).send(response)
  })
})

// Handle fashion PUT route
app.put('/fashion/:id', (req, res) => {
  const {
    id
  } = req.params
  const query = `SELECT * FROM fashion_tb WHERE id=${id} LIMIT 1`
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = {
        data: null,
        message: err.message,
      }
      res.send(response)
    }

    const {
      id,
      name,
      height,
      weight,
      avatar,
      color
    } = {
      ...results[0],
      ...req.body
    }
    const query = `UPDATE fashioon_tb SET name='${name}', height='${height}', weight='${weight}', avatar='${avatar}', color='${color}' WHERE id='${id}'`
    pool.query(query, (err, results, fields) => {
      if (err) {
        const response = {
          data: null,
          message: err.message,
        }
        res.send(response)
      }

      const fashion = {
        id,
        name,
        height,
        weight,
        avatar,
        color
      }
      const response = {
        data: fashion,
        message: `Fashion ${name} has been successfully updated.`,
      }
      res.send(response)
    })
  })
})

// Handler fashion DELETE route
app.delete('/fashion/:id', (req, res) => {
  const {
    id
  } = req.params
  const query = `DELETE FROM fashion_tb WHERE id=${id}`
  pool.query(query, (err, results, fields) => {
    if (err) {
      const response = {
        data: null,
        message: err.message
      }
      res.send(response)
    }

    const response = {
      data: null,
      message: `Fashion with id: ${id} successfully deleted.`,
    }
    res.send(response)
  })
})

// Handle in-valid route
app.all('*', function (req, res) {
  const response = {
    data: null,
    message: 'Route not found!!'
  }
  res.status(400).send(response)
})

// wrap express app instance with serverless http function
module.exports.handler = serverless(app)
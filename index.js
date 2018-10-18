const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const pool = require('./configs/dbConfig');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get(['/', '/pokemon/'], (req, res) => {
  pool.query('SELECT * FROM pokemon_tb', (err, results, fields) => {
    if (err){
      res.send({ data: null, status: 400, error: err.message });
    }

    const pokemons = [...results];
    res.send({ data: pokemons });
  });
});

app.get('/pokemon/:id', (req, res) => {
  const id = req.params.id;
  pool.query(`SELECT * FROM pokemon_tb WHERE id=${id}`, (err, results, fields) => {
    if (err) {
      res.send({ data: null, status: 400, error: err.message });
    }

    const pokemon = results[0];
    res.send({data: pokemon});
  });
});

app.post('/pokemon/', (req, res) => {
  const { name, height, weight, avatar } = req.body;
  const query = `INSERT INTO pokemon_tb (name, height, weight, avatar) VALUES ('${name}', '${height}', '${weight}', '${avatar}')`;
  pool.query(query, (err, results, fields) => {
    if (err) {
      res.send({ data: null, status: 400, error: err.message });
    }
    const { insertId } = results;
    const insertedPokemon = { id: insertId, name, height, weight, avatar };
    res.send({ data: insertedPokemon });
  });
});

app.put('/pokemon/:id', (req, res) => {
  const id = req.params.id;
  pool.query(`SELECT * FROM pokemon_tb WHERE id=${id} LIMIT 1`, (err, results, fields) => {
    if (err) {
      res.send({ data: null, status: 400, error: err.message });
    }

    const { id, name, height, weight, avatar } = {...results[0], ...req.body};
    const query = `UPDATE pokemon_tb SET name='${name}', height='${height}', weight='${weight}', avatar='${avatar}' WHERE id='${id}'`;
    pool.query(query, (err, results, fields) => {
      if (err) {
        res.send({ data: null, status: 400, error: err.message });
      }

      res.send({ data: { id, name, height, weight, avatar } });
    });
  });
});

app.delete('/pokemon/:id', (req, res) => {
  const id = req.params.id;
  pool.query(`DELETE FROM pokemon_tb WHERE id='${id}'`, (err, results, fields) => {
    if (err) {
      res.send({ data: null, status: 400, error: err.message });
    }
    res.send({ data: null, message: 'Pokemon successfully deleted'});
  });
});

app.all('*', function(req, res){
  res.send({ data: null, message: '404 - Route not found!!' });
});

module.exports.handler = serverless(app);
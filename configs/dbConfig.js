const mysql = require('mysql');
const pool  = mysql.createPool({
  host            : 'localhost',
  user            : 'root',
  password        : '12345',
  database        : 'pokemon_app_db'
});

module.exports = pool;
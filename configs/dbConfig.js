const mysql = require('mysql');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'scott',
  password: 'Ranger1975#',
  database: 'fashion_app_db',
});

module.exports = pool;
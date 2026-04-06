const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'admin12', 
  database: 'monur10',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;
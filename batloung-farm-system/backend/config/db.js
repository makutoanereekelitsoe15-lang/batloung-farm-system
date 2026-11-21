// ---------------------------------------------------------------
// config/db.js
// Creates ONE reusable MySQL connection pool with mysql2/promise.
// A pool is better than a single connection: it re-opens connections
// automatically and is safe when several requests arrive at once.
// ---------------------------------------------------------------
const mysql = require('mysql2/promise');
const config = require('./env');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // DECIMAL comes back as a string by default; converting keeps maths simple.
  decimalNumbers: true,
  // Keep DATE / DATETIME as plain strings so the JSON is easy to read.
  dateStrings: true,
  charset: 'utf8mb4',
});

/**
 * Test the connection once at start-up.
 * We never let a database failure crash the process — the server keeps
 * running and returns a friendly 503 message instead.
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('[DB] Connected to MySQL database:', config.db.database);
    return true;
  } catch (error) {
    console.error('[DB] Could NOT connect to MySQL:', error.message);
    console.error('[DB] The API will stay online and return 503 until the database is reachable.');
    return false;
  }
}

module.exports = { pool, testConnection };

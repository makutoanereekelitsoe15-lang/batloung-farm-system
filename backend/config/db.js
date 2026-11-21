// ---------------------------------------------------------------
// config/db.js
// Creates ONE reusable MySQL connection pool with mysql2/promise.
// Supports both local MySQL and cloud DATABASE_URL / MYSQL_URL.
// ---------------------------------------------------------------
const mysql = require('mysql2/promise');
const config = require('./env');

const poolOptions = config.db.url
  ? {
      uri: config.db.url,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      decimalNumbers: true,
      dateStrings: true,
      charset: 'utf8mb4',
    }
  : {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      decimalNumbers: true,
      dateStrings: true,
      charset: 'utf8mb4',
    };

const pool = mysql.createPool(poolOptions);

/**
 * Test the connection once at start-up.
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('[DB] Connected to MySQL database:', config.db.database || 'Cloud DB');
    return true;
  } catch (error) {
    console.error('[DB] Could NOT connect to MySQL:', error.message);
    console.error('[DB] The API will stay online and return 503 until the database is reachable.');
    return false;
  }
}

module.exports = { pool, testConnection };

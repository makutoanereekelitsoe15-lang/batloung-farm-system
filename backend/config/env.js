// ---------------------------------------------------------------
// config/env.js
// Loads .env and checks that required variables are present.
// Supports both individual DB variables and cloud DATABASE_URL strings.
// ---------------------------------------------------------------
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const isDatabaseUrlPresent = Boolean(process.env.DATABASE_URL || process.env.MYSQL_URL);

if (!isDatabaseUrlPresent) {
  const requiredVariables = ['DB_HOST', 'DB_USER', 'DB_NAME'];
  const missing = requiredVariables.filter(function (name) {
    const value = process.env[name];
    return value === undefined || String(value).trim() === '';
  });

  if (missing.length > 0) {
    console.error('\n[CONFIG ERROR] Missing environment variables:');
    missing.forEach(function (name) {
      console.error('   - ' + name);
    });
    console.error('\nCopy backend/.env.example to backend/.env and fill in the values.\n');
    process.exit(1);
  }
}

const config = {
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  db: {
    url: process.env.DATABASE_URL || process.env.MYSQL_URL,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'batloung_farm_db',
  },
};

module.exports = config;

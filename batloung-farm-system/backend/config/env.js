// ---------------------------------------------------------------
// config/env.js
// Loads .env and checks that every required variable is present.
// If something is missing, the server stops immediately with a clear
// message instead of crashing later with a confusing MySQL error.
// ---------------------------------------------------------------
const path = require('path');

// dotenv reads the .env file that sits next to the backend folder.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// These are the values the app cannot run without.
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

const config = {
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  },
};

module.exports = config;

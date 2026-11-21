// ---------------------------------------------------------------
// server.js — the entry point of the Batloung Farm API
//
// Order matters here:
//   1. create the Express app
//   2. activate the middleware (JSON parsing, CORS)
//   3. mount every module's routes under /api/...
//   4. serve the built React app (production)
//   5. add the 404 handler and the central error handler LAST
// ---------------------------------------------------------------
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

// config/env must be required first: it loads and validates .env
const config = require('./config/env');
const { testConnection, pool } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errors');

// Route modules
const supplierRoutes = require('./routes/supplierRoutes');
const fruitRoutes = require('./routes/fruitRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const saleRoutes = require('./routes/saleRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const stockRoutes = require('./routes/stockRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// ---- Global middleware -----------------------------------------
app.use(cors({ origin: true }));            // allow the React dev server
app.use(express.json());                    // parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// A tiny request logger so you can see every call while learning.
app.use(function (req, res, next) {
  console.log(req.method, req.originalUrl);
  next();
});

// ---- Health check ---------------------------------------------
app.get('/api/health', async function (req, res) {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, message: 'API and database are running', database: config.db.database });
  } catch (error) {
    res.status(503).json({ success: false, message: 'API is running but the database is unavailable' });
  }
});

// ---- API routes -----------------------------------------------
app.use('/api/suppliers', supplierRoutes);
app.use('/api/fruits', fruitRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ---- Serve the production build of the React app ----------------
// After `npm run build` inside /frontend, the Express server can host
// the whole system on one port, which is handy for the live demo.
const clientBuild = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get(/^\/(?!api).*/, function (req, res) {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// ---- 404 + central error handler (always last) -----------------
app.use(notFound);
app.use(errorHandler);

// ---- Start the server -----------------------------------------
const server = app.listen(config.port, function () {
  console.log('=====================================================');
  console.log(' Batloung Farm API running on http://localhost:' + config.port);
  console.log(' Health check      : /api/health');
  console.log('=====================================================');
  testConnection();
});

// Close MySQL cleanly when the terminal stops the server (Ctrl + C).
process.on('SIGINT', function () {
  console.log('\nShutting down... closing MySQL pool.');
  server.close(function () {
    pool.end().then(function () {
      process.exit(0);
    });
  });
});

// Never let an unexpected error crash the whole application.
process.on('unhandledRejection', function (reason) {
  console.error('[UNHANDLED REJECTION]', reason);
});

module.exports = app;

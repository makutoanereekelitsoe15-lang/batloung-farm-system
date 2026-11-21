// ---------------------------------------------------------------
// controllers/reportController.js
// The four required reports + the dashboard overview.
// ---------------------------------------------------------------
const reportModel = require('../models/reportModel');
const { ApiError } = require('../middleware/errors');
const v = require('../utils/validate');

// GET /api/reports/top-fruits  -> Report 1
exports.topFruits = async function (req, res) {
  const rows = await reportModel.topFruits();
  res.json({ success: true, count: rows.length, data: rows });
};

// GET /api/reports/revenue?startDate=2026-09-01&endDate=2026-10-31  -> Report 2
exports.revenue = async function (req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const startDate = req.query.startDate ? v.isoDate(req.query.startDate, 'Start date') : '2000-01-01';
  const endDate = req.query.endDate ? v.isoDate(req.query.endDate, 'End date') : today;

  if (startDate > endDate) {
    throw new ApiError(400, 'Start date cannot be after the end date.');
  }

  const report = await reportModel.revenueByDateRange(startDate, endDate);
  res.json({ success: true, data: report });
};

// GET /api/reports/top-vendor  -> Report 3
exports.topVendor = async function (req, res) {
  const row = await reportModel.topVendor();
  res.json({ success: true, data: row });
};

// GET /api/reports/stock  -> Report 4
exports.stock = async function (req, res) {
  const rows = await reportModel.currentStock();
  res.json({ success: true, count: rows.length, data: rows });
};

// ---------------------------------------------------------------
// controllers/dashboardController.js
// The six numbers shown on the dashboard overview cards.
// ---------------------------------------------------------------
const reportModel = require('../models/reportModel');

exports.getSummary = async function (req, res) {
  const summary = await reportModel.dashboard();
  res.json({ success: true, data: summary });
};

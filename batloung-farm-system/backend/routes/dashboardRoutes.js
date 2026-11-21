// routes/dashboardRoutes.js
const express = require('express');
const controller = require('../controllers/dashboardController');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

router.get('/', asyncHandler(controller.getSummary));

module.exports = router;

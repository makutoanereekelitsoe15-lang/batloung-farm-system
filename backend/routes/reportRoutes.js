// routes/reportRoutes.js
const express = require('express');
const controller = require('../controllers/reportController');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

router.get('/top-fruits', asyncHandler(controller.topFruits));   // report 1
router.get('/revenue', asyncHandler(controller.revenue));        // report 2
router.get('/top-vendor', asyncHandler(controller.topVendor));   // report 3
router.get('/stock', asyncHandler(controller.stock));            // report 4

module.exports = router;

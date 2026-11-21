// routes/paymentRoutes.js
const express = require('express');
const controller = require('../controllers/paymentController');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

router.get('/', asyncHandler(controller.getAll));
router.get('/outstanding', asyncHandler(controller.getOutstanding));
router.get('/sale/:saleId', asyncHandler(controller.getForSale));
router.post('/', asyncHandler(controller.create));

module.exports = router;

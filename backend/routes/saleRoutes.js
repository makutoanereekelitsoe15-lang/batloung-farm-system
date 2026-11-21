// routes/saleRoutes.js
const express = require('express');
const controller = require('../controllers/saleController');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

router.get('/', asyncHandler(controller.getAll));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', asyncHandler(controller.create));

module.exports = router;

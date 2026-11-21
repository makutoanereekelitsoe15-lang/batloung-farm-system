// routes/purchaseRoutes.js
const express = require('express');
const controller = require('../controllers/purchaseController');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

router.get('/', asyncHandler(controller.getAll));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', asyncHandler(controller.create));
router.put('/:id/cancel', asyncHandler(controller.cancel));

module.exports = router;

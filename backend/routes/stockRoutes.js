// routes/stockRoutes.js
const express = require('express');
const controller = require('../controllers/stockController');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

router.get('/', asyncHandler(controller.getAll));
router.get('/low', asyncHandler(controller.getLow));          // must come BEFORE /:id style routes
router.get('/check', asyncHandler(controller.check));

module.exports = router;

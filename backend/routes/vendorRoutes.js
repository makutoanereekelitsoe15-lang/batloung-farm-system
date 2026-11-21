// routes/vendorRoutes.js
const express = require('express');
const controller = require('../controllers/vendorController');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

router.get('/', asyncHandler(controller.getAll));       // ?search= supports name / phone
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));

module.exports = router;

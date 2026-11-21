// routes/supplierRoutes.js — only route -> controller wiring, no SQL.
const express = require('express');
const controller = require('../controllers/supplierController');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

router.get('/', asyncHandler(controller.getAll));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;

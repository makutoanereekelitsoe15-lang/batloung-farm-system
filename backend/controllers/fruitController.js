// ---------------------------------------------------------------
// controllers/fruitController.js
// Fruit management + stock lookups by fruit and packaging size.
// ---------------------------------------------------------------
const fruitModel = require('../models/fruitModel');
const stockModel = require('../models/stockModel');
const { ApiError } = require('../middleware/errors');
const v = require('../utils/validate');

function readFruitBody(body, isUpdate) {
  const status = v.cleanText(body.status || 'ACTIVE').toUpperCase();
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    throw new ApiError(400, 'Status must be ACTIVE or INACTIVE.');
  }

  return {
    fruit_name: v.requiredText(body.fruit_name, 'Fruit name', 2),
    description: v.cleanText(body.description) || 'No description provided',
    status: status,
  };
}

// GET /api/fruits?status=ACTIVE
exports.getAll = async function (req, res) {
  const status = req.query.status ? v.cleanText(req.query.status).toUpperCase() : null;
  if (status && !['ACTIVE', 'INACTIVE'].includes(status)) {
    throw new ApiError(400, 'Status filter must be ACTIVE or INACTIVE.');
  }
  const fruits = await fruitModel.findAll({ status });
  res.json({ success: true, count: fruits.length, data: fruits });
};

// GET /api/fruits/:id
exports.getOne = async function (req, res) {
  const id = v.parseId(req.params.id, 'Fruit ID');
  const fruit = await fruitModel.findById(id);
  if (!fruit) throw new ApiError(404, 'Fruit ' + id + ' was not found.');

  const stockRows = [];
  for (const size of fruitModel.PACKAGING_SIZES) {
    const row = await stockModel.findByFruitAndSize(id, size);
    stockRows.push({
      packaging_size: size,
      available_quantity: row ? row.available_quantity : 0,
    });
  }

  res.json({ success: true, data: { ...fruit, stock: stockRows } });
};

// POST /api/fruits
exports.create = async function (req, res) {
  const fruit = readFruitBody(req.body);

  const duplicate = await fruitModel.findByName(fruit.fruit_name);
  if (duplicate) {
    throw new ApiError(409, 'A fruit called "' + fruit.fruit_name + '" already exists.');
  }

  const created = await fruitModel.create(fruit);
  res.status(201).json({
    success: true,
    message: 'Fruit added successfully with SMALL, MEDIUM and LARGE stock buckets.',
    data: created,
  });
};

// PUT /api/fruits/:id
exports.update = async function (req, res) {
  const id = v.parseId(req.params.id, 'Fruit ID');
  const existing = await fruitModel.findById(id);
  if (!existing) throw new ApiError(404, 'Fruit ' + id + ' was not found.');

  const fruit = readFruitBody(req.body, true);

  const duplicate = await fruitModel.findByName(fruit.fruit_name);
  if (duplicate && duplicate.fruit_id !== id) {
    throw new ApiError(409, 'Another fruit is already called "' + fruit.fruit_name + '".');
  }

  const updated = await fruitModel.update(id, fruit);
  res.json({ success: true, message: 'Fruit updated successfully.', data: updated });
};

// DELETE /api/fruits/:id
exports.remove = async function (req, res) {
  const id = v.parseId(req.params.id, 'Fruit ID');
  const existing = await fruitModel.findById(id);
  if (!existing) throw new ApiError(404, 'Fruit ' + id + ' was not found.');

  try {
    await fruitModel.remove(id);
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new ApiError(
        409,
        'This fruit appears in purchases or sales and cannot be deleted. Set its status to INACTIVE instead.'
      );
    }
    throw error;
  }

  res.json({ success: true, message: 'Fruit deleted successfully.' });
};

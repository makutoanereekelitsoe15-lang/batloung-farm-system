// ---------------------------------------------------------------
// controllers/stockController.js
// Stock list, low-stock warnings and a single fruit/size lookup.
// ---------------------------------------------------------------
const stockModel = require('../models/stockModel');
const fruitModel = require('../models/fruitModel');
const { ApiError } = require('../middleware/errors');
const v = require('../utils/validate');

// GET /api/stock
exports.getAll = async function (req, res) {
  const stock = await stockModel.findAll();
  res.json({ success: true, count: stock.length, data: stock });
};

// GET /api/stock/low
exports.getLow = async function (req, res) {
  const rows = await stockModel.findLowStock();
  res.json({ success: true, count: rows.length, data: rows });
};

// GET /api/stock/check?fruitId=1&packagingSize=LARGE
exports.check = async function (req, res) {
  const fruitId = v.positiveInteger(req.query.fruitId, 'Fruit');
  const packaging = v.packagingSize(req.query.packagingSize);

  const fruit = await fruitModel.findById(fruitId);
  if (!fruit) throw new ApiError(404, 'Fruit ' + fruitId + ' was not found.');

  const row = await stockModel.findByFruitAndSize(fruitId, packaging);
  res.json({
    success: true,
    data: {
      fruit_id: fruitId,
      fruit_name: fruit.fruit_name,
      packaging_size: packaging,
      available_quantity: row ? row.available_quantity : 0,
      reorder_level: row ? row.reorder_level : 0,
    },
  });
};

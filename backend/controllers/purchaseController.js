// ---------------------------------------------------------------
// controllers/purchaseController.js
// PART C/D : create and cancel purchases.
// ---------------------------------------------------------------
const purchaseModel = require('../models/purchaseModel');
const supplierModel = require('../models/supplierModel');
const fruitModel = require('../models/fruitModel');
const { ApiError } = require('../middleware/errors');
const v = require('../utils/validate');

/**
 * Validate the items array sent by the React purchase form.
 * Returns a clean list with the fruit name added for error messages.
 */
async function readItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new ApiError(400, 'A purchase must contain at least one fruit item.');
  }

  const items = [];
  const seen = new Set(); // stops the same fruit + size twice in one purchase

  for (let index = 0; index < rawItems.length; index++) {
    const row = rawItems[index] || {};
    const position = 'Item ' + (index + 1) + ': ';

    const fruitId = v.positiveInteger(row.fruit_id, position + 'fruit');
    const packaging = v.packagingSize(row.packaging_size);
    const quantity = v.positiveInteger(row.quantity, position + 'quantity');
    const unitCost = v.positiveMoney(row.unit_cost, position + 'unit cost');

    const key = fruitId + '-' + packaging;
    if (seen.has(key)) {
      throw new ApiError(400, position + 'this fruit and packaging size appears twice.');
    }
    seen.add(key);

    const fruit = await fruitModel.findById(fruitId);
    if (!fruit) {
      throw new ApiError(404, position + 'fruit ' + fruitId + ' does not exist.');
    }

    items.push({
      fruit_id: fruitId,
      fruit_name: fruit.fruit_name,
      packaging_size: packaging,
      quantity: quantity,
      unit_cost: unitCost,
    });
  }

  return items;
}

// GET /api/purchases
exports.getAll = async function (req, res) {
  const purchases = await purchaseModel.findAll();
  res.json({ success: true, count: purchases.length, data: purchases });
};

// GET /api/purchases/:id
exports.getOne = async function (req, res) {
  const id = v.parseId(req.params.id, 'Purchase ID');
  const purchase = await purchaseModel.findById(id);
  if (!purchase) throw new ApiError(404, 'Purchase ' + id + ' was not found.');
  res.json({ success: true, data: purchase });
};

// POST /api/purchases
exports.create = async function (req, res) {
  const body = req.body || {};

  const supplierId = v.positiveInteger(body.supplier_id, 'Supplier');
  const supplier = await supplierModel.findById(supplierId);
  if (!supplier) throw new ApiError(404, 'Supplier ' + supplierId + ' does not exist.');

  const items = await readItems(body.items);

  const purchase = await purchaseModel.create(supplierId, items);

  res.status(201).json({
    success: true,
    message: 'Purchase recorded. Stock has been increased for ' + items.length + ' item(s).',
    data: purchase,
  });
};

// PUT /api/purchases/:id/cancel
exports.cancel = async function (req, res) {
  const id = v.parseId(req.params.id, 'Purchase ID');
  const cancelledPurchase = await purchaseModel.cancel(id);
  res.json({
    success: true,
    message: `Purchase #${id} has been cancelled and stock has been reduced accordingly.`,
    data: cancelledPurchase,
  });
};

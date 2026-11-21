// ---------------------------------------------------------------
// controllers/saleController.js
// PART C/D : create a sale with several fruit lines.
// Validation happens first; then the model runs the transaction that
// checks stock and rolls everything back if a single line fails.
// ---------------------------------------------------------------
const saleModel = require('../models/saleModel');
const vendorModel = require('../models/vendorModel');
const fruitModel = require('../models/fruitModel');
const stockModel = require('../models/stockModel');
const { ApiError } = require('../middleware/errors');
const v = require('../utils/validate');

async function readItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new ApiError(400, 'A sale must contain at least one fruit item.');
  }

  const items = [];
  const seen = new Set();

  for (let index = 0; index < rawItems.length; index++) {
    const row = rawItems[index] || {};
    const position = 'Item ' + (index + 1) + ': ';

    const fruitId = v.positiveInteger(row.fruit_id, position + 'fruit');
    const packaging = v.packagingSize(row.packaging_size);
    const quantity = v.positiveInteger(row.quantity, position + 'quantity');
    const unitPrice = v.positiveMoney(row.unit_price, position + 'unit price');

    const key = fruitId + '-' + packaging;
    if (seen.has(key)) {
      throw new ApiError(400, position + 'this fruit and packaging size appears twice.');
    }
    seen.add(key);

    const fruit = await fruitModel.findById(fruitId);
    if (!fruit) {
      throw new ApiError(404, position + 'fruit ' + fruitId + ' does not exist.');
    }

    // Friendly early check so the user sees the available stock immediately.
    // The real protection (row locking) still happens inside the transaction.
    const stock = await stockModel.findByFruitAndSize(fruitId, packaging);
    const available = stock ? stock.available_quantity : 0;
    if (available < quantity) {
      throw new ApiError(
        400,
        'Insufficient stock for ' + fruit.fruit_name + ' (' + packaging + '): ' +
        'only ' + available + ' box(es) available but ' + quantity + ' requested. ' +
        'The whole sale was rejected.'
      );
    }

    items.push({
      fruit_id: fruitId,
      fruit_name: fruit.fruit_name,
      packaging_size: packaging,
      quantity: quantity,
      unit_price: unitPrice,
      available_before: available,
    });
  }

  return items;
}

function readPayment(rawPayment, total) {
  const payment = rawPayment || {};
  const method = v.cleanText(payment.payment_method || 'CASH').toUpperCase();
  if (!v.PAYMENT_METHODS.includes(method) || method === 'CREDIT') {
    // CREDIT is not chosen directly: it is set automatically when money is owed.
    if (method !== 'CREDIT') {
      throw new ApiError(400, 'Payment method must be CASH, MOBILE_MONEY or CREDIT.');
    }
  }

  let amountPaid = 0;
  if (payment.amount_paid !== undefined && payment.amount_paid !== null && payment.amount_paid !== '') {
    amountPaid = Number(payment.amount_paid);
    if (!Number.isFinite(amountPaid) || amountPaid < 0) {
      throw new ApiError(400, 'Amount paid must be zero or more.');
    }
  } else if (method === 'CASH' || method === 'MOBILE_MONEY') {
    // Cash / mobile money with no amount typed in = paid in full.
    amountPaid = total;
  }

  amountPaid = Math.round(amountPaid * 100) / 100;
  if (amountPaid > total) {
    throw new ApiError(
      400,
      'Amount paid (R' + amountPaid.toFixed(2) + ') cannot be more than the sale total (R' + total.toFixed(2) + ').'
    );
  }

  return {
    amount_paid: amountPaid,
    payment_method: method === 'CREDIT' ? 'CREDIT' : method,
    reference: v.cleanText(payment.reference),
  };
}

// GET /api/sales?status=UNPAID&vendorId=2
exports.getAll = async function (req, res) {
  const status = req.query.status ? v.cleanText(req.query.status).toUpperCase() : null;
  if (status && !['PAID', 'PARTIALLY_PAID', 'UNPAID'].includes(status)) {
    throw new ApiError(400, 'Status filter must be PAID, PARTIALLY_PAID or UNPAID.');
  }
  const vendorId = req.query.vendorId ? v.positiveInteger(req.query.vendorId, 'Vendor ID') : null;

  const sales = await saleModel.findAll({ status, vendorId });
  res.json({ success: true, count: sales.length, data: sales });
};

// GET /api/sales/:id
exports.getOne = async function (req, res) {
  const id = v.parseId(req.params.id, 'Sale ID');
  const sale = await saleModel.findById(id);
  if (!sale) throw new ApiError(404, 'Sale ' + id + ' was not found.');
  res.json({ success: true, data: sale });
};

// POST /api/sales
exports.create = async function (req, res) {
  const body = req.body || {};

  const vendorId = v.positiveInteger(body.vendor_id, 'Vendor');
  const vendor = await vendorModel.findById(vendorId);
  if (!vendor) throw new ApiError(404, 'Vendor ' + vendorId + ' does not exist.');

  const items = await readItems(body.items);

  // Total calculated here only for validating the payment amount;
  // the model calculates it again before saving.
  const total = Math.round(items.reduce(function (sum, item) {
    return sum + item.quantity * item.unit_price;
  }, 0) * 100) / 100;

  const payment = readPayment(body.payment, total);

  const sale = await saleModel.create(vendorId, items, payment);

  res.status(201).json({
    success: true,
    message:
      'Sale recorded. Stock reduced for ' + items.length + ' item(s). ' +
      'Payment status: ' + sale.payment_status + '.',
    data: sale,
  });
};

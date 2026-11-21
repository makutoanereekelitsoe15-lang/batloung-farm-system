// ---------------------------------------------------------------
// controllers/paymentController.js
// Record cash / mobile money / bank transfer payments against a sale.
// The sale status changes automatically:
//   PAID -> PARTIALLY_PAID -> PAID again when the balance reaches zero.
// ---------------------------------------------------------------
const paymentModel = require('../models/paymentModel');
const saleModel = require('../models/saleModel');
const { ApiError } = require('../middleware/errors');
const v = require('../utils/validate');

// GET /api/payments
exports.getAll = async function (req, res) {
  const payments = await paymentModel.findAll();
  res.json({ success: true, count: payments.length, data: payments });
};

// GET /api/payments/outstanding
exports.getOutstanding = async function (req, res) {
  const rows = await paymentModel.findOutstanding();
  const total = rows.reduce(function (sum, row) {
    return sum + Number(row.outstanding_balance);
  }, 0);
  res.json({ success: true, count: rows.length, total_outstanding: total, data: rows });
};

// GET /api/payments/sale/:saleId
exports.getForSale = async function (req, res) {
  const saleId = v.parseId(req.params.saleId, 'Sale ID');
  const sale = await saleModel.findById(saleId);
  if (!sale) throw new ApiError(404, 'Sale ' + saleId + ' was not found.');

  const payments = await paymentModel.findBySaleId(saleId);
  res.json({
    success: true,
    data: {
      sale_id: sale.sale_id,
      total_amount: sale.total_amount,
      amount_paid: sale.amount_paid,
      outstanding_balance: sale.outstanding_balance,
      payment_status: sale.payment_status,
      history: payments,
    },
  });
};

// POST /api/payments
exports.create = async function (req, res) {
  const body = req.body || {};

  const saleId = v.positiveInteger(body.sale_id, 'Sale');
  const amount = v.positiveMoney(body.amount, 'Payment amount');

  const method = v.cleanText(body.payment_method || 'CASH').toUpperCase();
  if (!v.PAYMENT_CHANNELS.includes(method)) {
    throw new ApiError(400, 'Payment method must be CASH, MOBILE_MONEY or BANK_TRANSFER.');
  }

  const sale = await saleModel.findById(saleId);
  if (!sale) throw new ApiError(404, 'Sale ' + saleId + ' was not found.');

  const payment = await paymentModel.create({
    sale_id: saleId,
    amount: amount,
    payment_method: method,
    reference: v.cleanText(body.reference) || 'PAY-' + saleId + '-' + Date.now().toString().slice(-6),
    notes: v.cleanText(body.notes),
  });

  res.status(201).json({
    success: true,
    message:
      'Payment recorded. Sale is now ' + payment.payment_status +
      ' with R' + Number(payment.new_outstanding_balance).toFixed(2) + ' outstanding.',
    data: payment,
  });
};

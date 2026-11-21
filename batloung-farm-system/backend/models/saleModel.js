// ---------------------------------------------------------------
// models/saleModel.js
// PART D (the most important part of the project).
//
// A sale must be ALL-OR-NOTHING:
//   START TRANSACTION
//     lock the stock rows of every requested fruit (SELECT ... FOR UPDATE)
//     check EVERY line before changing anything
//         -> if any line has too little stock: ROLLBACK and reject
//     insert the sale (total calculated on the server)
//     insert sales_details
//     reduce stock with a conditional UPDATE (... AND available_quantity >= ?)
//   COMMIT
//
// Two vendors selling at the same moment cannot oversell: the first one
// locks the stock row, the second one waits and then sees the new value.
// ---------------------------------------------------------------
const { pool } = require('../config/db');

/**
 * Build the payment fields from the amount the vendor pays today.
 *   amountPaid  = 0                  -> UNPAID
 *   amountPaid  < total              -> PARTIALLY_PAID
 *   amountPaid  = total              -> PAID
 */
function paymentState(total, amountPaid, method) {
  let status = 'UNPAID';
  if (amountPaid >= total && total > 0) status = 'PAID';
  else if (amountPaid > 0) status = 'PARTIALLY_PAID';

  // A sale fully paid on the spot is a normal cash/mobile money sale.
  // Anything left owing is treated as credit.
  const paymentMethod = status === 'PAID' ? method : 'CREDIT';
  return { status, paymentMethod };
}

async function findAll(filters) {
  const options = filters || {};
  const where = [];
  const params = [];

  if (options.status) {
    where.push('s.payment_status = ?');
    params.push(options.status);
  }
  if (options.vendorId) {
    where.push('s.vendor_id = ?');
    params.push(options.vendorId);
  }

  const [rows] = await pool.query(
    `SELECT s.sale_id, s.vendor_id, s.sale_date, s.payment_status, s.payment_method,
            s.total_amount, s.amount_paid, s.outstanding_balance,
            v.vendor_name, v.phone_number,
            COALESCE(SUM(d.quantity), 0) AS total_boxes
       FROM sales s
       JOIN vendors v ON v.vendor_id = s.vendor_id
       LEFT JOIN sales_details d ON d.sale_id = s.sale_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      GROUP BY s.sale_id, s.vendor_id, s.sale_date, s.payment_status, s.payment_method,
               s.total_amount, s.amount_paid, s.outstanding_balance,
               v.vendor_name, v.phone_number
      ORDER BY s.sale_date DESC, s.sale_id DESC`,
    params
  );
  return rows;
}

async function findById(saleId) {
  const [saleRows] = await pool.query(
    `SELECT s.*, v.vendor_name, v.phone_number, v.location
       FROM sales s
       JOIN vendors v ON v.vendor_id = s.vendor_id
      WHERE s.sale_id = ?`,
    [saleId]
  );
  if (saleRows.length === 0) return null;

  const [itemRows] = await pool.query(
    `SELECT d.sales_detail_id, d.fruit_id, f.fruit_name, d.packaging_size,
            d.quantity, d.unit_price, d.line_total
       FROM sales_details d
       JOIN fruits f ON f.fruit_id = d.fruit_id
      WHERE d.sale_id = ?
      ORDER BY d.sales_detail_id`,
    [saleId]
  );

  const [paymentRows] = await pool.query(
    'SELECT * FROM payments WHERE sale_id = ? ORDER BY payment_date, payment_id',
    [saleId]
  );

  const sale = saleRows[0];
  sale.items = itemRows;
  sale.payments = paymentRows;
  return sale;
}

/**
 * Create a sale with several fruit lines.
 *
 * @param {number} vendorId
 * @param {Array}  items          [{ fruit_id, packaging_size, quantity, unit_price }]
 * @param {object} payment        { amount_paid, payment_method, reference }
 */
async function create(vendorId, items, payment) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // ---- 1. Vendor must exist -----------------------------------------
    const [vendorRows] = await connection.query(
      'SELECT vendor_id FROM vendors WHERE vendor_id = ? FOR UPDATE',
      [vendorId]
    );
    if (vendorRows.length === 0) {
      const err = new Error('Vendor not found.');
      err.statusCode = 404;
      throw err;
    }

    // ---- 2. Lock every stock row involved and check stock FIRST --------
    //  Nothing is written until every single line has been approved.
    for (const item of items) {
      const [stockRows] = await connection.query(
        `SELECT stock_id, available_quantity
           FROM stock
          WHERE fruit_id = ? AND packaging_size = ?
          FOR UPDATE`,                         // row lock: blocks other sales
        [item.fruit_id, item.packaging_size]
      );

      if (stockRows.length === 0 || stockRows[0].available_quantity < item.quantity) {
        const available = stockRows.length === 0 ? 0 : stockRows[0].available_quantity;
        const err = new Error(
          item.fruit_name +
          ' (' + item.packaging_size + '): only ' + available +
          ' box(es) available but ' + item.quantity + ' requested.'
        );
        err.statusCode = 400;
        err.code = 'INSUFFICIENT_STOCK';
        throw err;                              // -> caught below -> ROLLBACK
      }
    }

    // ---- 3. Calculate the total on the server --------------------------
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.unit_price;
    }
    totalAmount = Math.round(totalAmount * 100) / 100;

    // ---- 4. Validate the payment amount --------------------------------
    const requestedPaid = Number(payment && payment.amount_paid ? payment.amount_paid : 0);
    if (requestedPaid < 0 || requestedPaid > totalAmount) {
      const err = new Error(
        'Amount paid (R' + requestedPaid.toFixed(2) + ') must be between R0.00 and the sale total (R' +
        totalAmount.toFixed(2) + ').'
      );
      err.statusCode = 400;
      throw err;
    }
    const amountPaid = Math.round(requestedPaid * 100) / 100;
    const method = (payment && payment.payment_method) || 'CASH';
    const { status, paymentMethod } = paymentState(totalAmount, amountPaid, method);

    // ---- 5. Save the sale header ----------------------------------------
    const [saleResult] = await connection.query(
      `INSERT INTO sales
         (vendor_id, total_amount, amount_paid, payment_status, payment_method)
       VALUES (?, ?, ?, ?, ?)`,
      [vendorId, totalAmount, amountPaid, status, paymentMethod]
    );
    const saleId = saleResult.insertId;

    // ---- 6. Save every line and reduce the stock ------------------------
    for (const item of items) {
      await connection.query(
        `INSERT INTO sales_details
           (sale_id, fruit_id, packaging_size, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?)`,
        [saleId, item.fruit_id, item.packaging_size, item.quantity, item.unit_price]
      );

      // Second safety net: the UPDATE only succeeds while there is enough
      // stock. If two sales race, one of them affects 0 rows here.
      const [stockUpdate] = await connection.query(
        `UPDATE stock
            SET available_quantity = available_quantity - ?
          WHERE fruit_id = ? AND packaging_size = ?
            AND available_quantity >= ?`,
        [item.quantity, item.fruit_id, item.packaging_size, item.quantity]
      );

      if (stockUpdate.affectedRows === 0) {
        const err = new Error(
          item.fruit_name + ' (' + item.packaging_size +
          '): stock changed while saving. Please refresh and try again.'
        );
        err.statusCode = 400;
        err.code = 'INSUFFICIENT_STOCK';
        throw err;
      }
    }

    // ---- 7. Record the payment history entry ----------------------------
    if (amountPaid > 0) {
      await connection.query(
        `INSERT INTO payments (sale_id, amount, payment_method, reference, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [
          saleId,
          amountPaid,
          method === 'MOBILE_MONEY' ? 'MOBILE_MONEY' : 'CASH',
          (payment && payment.reference) || '',
          status === 'PAID' ? 'Full payment at point of sale' : 'Part payment at point of sale',
        ]
      );
    }

    // ---- 8. Commit ------------------------------------------------------
    await connection.commit();
    return await findById(saleId);
  } catch (error) {
    // Any problem at all: undo the sale, the lines AND the stock change.
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { findAll, findById, create, paymentState };

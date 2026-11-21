// ---------------------------------------------------------------
// models/paymentModel.js
// PART D : vendor payments.
//
// Every payment is written to the payments table (payment history) and
// then the sale is recalculated:
//   amount_paid = SUM(payments.amount)
//   status      = PAID / PARTIALLY_PAID / UNPAID   (updated automatically)
// ---------------------------------------------------------------
const { pool } = require('../config/db');

async function findAll() {
  const [rows] = await pool.query(
    `SELECT pay.payment_id, pay.sale_id, pay.amount, pay.payment_method,
            pay.payment_date, pay.reference, pay.notes,
            s.total_amount, s.amount_paid, s.outstanding_balance, s.payment_status,
            v.vendor_name
       FROM payments pay
       JOIN sales s   ON s.sale_id = pay.sale_id
       JOIN vendors v ON v.vendor_id = s.vendor_id
      ORDER BY pay.payment_date DESC, pay.payment_id DESC`
  );
  return rows;
}

async function findBySaleId(saleId) {
  const [rows] = await pool.query(
    'SELECT * FROM payments WHERE sale_id = ? ORDER BY payment_date, payment_id',
    [saleId]
  );
  return rows;
}

/** One row per vendor: how much they owe right now. */
async function findOutstanding() {
  const [rows] = await pool.query(
    `SELECT v.vendor_id, v.vendor_name, v.phone_number, v.location,
            COUNT(s.sale_id)                            AS invoice_count,
            COALESCE(SUM(s.total_amount), 0)            AS total_billed,
            COALESCE(SUM(s.amount_paid), 0)             AS total_paid,
            COALESCE(SUM(s.outstanding_balance), 0)     AS outstanding_balance
       FROM vendors v
       JOIN sales s ON s.vendor_id = v.vendor_id
      GROUP BY v.vendor_id, v.vendor_name, v.phone_number, v.location
     HAVING outstanding_balance > 0
      ORDER BY outstanding_balance DESC`
  );
  return rows;
}

/**
 * Record a payment against a sale.
 * Runs in a transaction so the history row and the sale status always agree.
 */
async function create(payment) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Lock the sale so two payments cannot be recorded at the same time.
    const [saleRows] = await connection.query(
      'SELECT sale_id, total_amount, amount_paid FROM sales WHERE sale_id = ? FOR UPDATE',
      [payment.sale_id]
    );

    if (saleRows.length === 0) {
      const err = new Error('Sale not found.');
      err.statusCode = 404;
      throw err;
    }

    const sale = saleRows[0];
    const outstanding = Math.round((sale.total_amount - sale.amount_paid) * 100) / 100;

    if (outstanding <= 0) {
      const err = new Error('This sale is already fully paid.');
      err.statusCode = 400;
      throw err;
    }

    if (payment.amount > outstanding) {
      const err = new Error(
        'Payment of R' + payment.amount.toFixed(2) + ' is more than the outstanding balance of R' +
        outstanding.toFixed(2) + '.'
      );
      err.statusCode = 400;
      throw err;
    }

    // 1. Save the history record.
    const [result] = await connection.query(
      `INSERT INTO payments (sale_id, amount, payment_method, reference, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [payment.sale_id, payment.amount, payment.payment_method, payment.reference, payment.notes]
    );

    // 2. Recalculate the sale from the full payment history.
    const [sumRows] = await connection.query(
      'SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments WHERE sale_id = ?',
      [payment.sale_id]
    );
    const totalPaid = Math.round(sumRows[0].total_paid * 100) / 100;

    let status = 'UNPAID';
    if (totalPaid >= sale.total_amount) status = 'PAID';
    else if (totalPaid > 0) status = 'PARTIALLY_PAID';

    await connection.query(
      `UPDATE sales
          SET amount_paid = ?, payment_status = ?,
              payment_method = CASE WHEN ? = 'PAID' THEN payment_method ELSE 'CREDIT' END
        WHERE sale_id = ?`,
      [totalPaid, status, status, payment.sale_id]
    );

    await connection.commit();

    const [rows] = await pool.query('SELECT * FROM payments WHERE payment_id = ?', [result.insertId]);
    const record = rows[0];
    record.payment_status = status;
    record.new_outstanding_balance = Math.round((sale.total_amount - totalPaid) * 100) / 100;
    return record;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { findAll, findBySaleId, findOutstanding, create };

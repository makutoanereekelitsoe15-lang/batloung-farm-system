// ---------------------------------------------------------------
// models/purchaseModel.js
// PART D : purchases are saved inside ONE MySQL transaction.
//
//   START TRANSACTION
//     insert the purchase row (total = 0 for now)
//     insert every purchase_details row (packaging, qty, unit cost)
//     increase stock for each fruit + packaging size
//     update the purchase total from the details
//   COMMIT            (only if everything succeeded)
//   ROLLBACK          (if anything failed)
//
// If one fruit line is wrong, NOTHING is saved and stock is unchanged.
// ---------------------------------------------------------------
const { pool } = require('../config/db');

async function findAll() {
  const [rows] = await pool.query(
    `SELECT p.purchase_id, p.supplier_id, p.purchase_date, p.total_amount, p.status,
            s.business_name AS supplier_name, s.province,
            COUNT(d.purchase_detail_id) AS line_count,
            COALESCE(SUM(d.quantity), 0) AS total_boxes
       FROM purchases p
       JOIN suppliers s ON s.supplier_id = p.supplier_id
       LEFT JOIN purchase_details d ON d.purchase_id = p.purchase_id
      GROUP BY p.purchase_id, p.supplier_id, p.purchase_date, p.total_amount, p.status,
               s.business_name, s.province
      ORDER BY p.purchase_date DESC, p.purchase_id DESC`
  );
  return rows;
}

async function findById(purchaseId) {
  const [purchaseRows] = await pool.query(
    `SELECT p.*, s.business_name AS supplier_name, s.province, s.contact_person
       FROM purchases p
       JOIN suppliers s ON s.supplier_id = p.supplier_id
      WHERE p.purchase_id = ?`,
    [purchaseId]
  );

  if (purchaseRows.length === 0) return null;

  const [itemRows] = await pool.query(
    `SELECT d.purchase_detail_id, d.fruit_id, f.fruit_name, d.packaging_size,
            d.quantity, d.unit_cost, d.line_total
       FROM purchase_details d
       JOIN fruits f ON f.fruit_id = d.fruit_id
      WHERE d.purchase_id = ?
      ORDER BY d.purchase_detail_id`,
    [purchaseId]
  );

  const purchase = purchaseRows[0];
  purchase.items = itemRows;
  return purchase;
}

/**
 * Create a purchase with several fruit lines.
 *
 * @param {number} supplierId
 * @param {Array}  items  [{ fruit_id, packaging_size, quantity, unit_cost }]
 * @returns the saved purchase (with its items)
 */
async function create(supplierId, items) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // --- 1. Supplier must exist (checked inside the transaction) -----
    const [supplierRows] = await connection.query(
      'SELECT supplier_id FROM suppliers WHERE supplier_id = ? FOR UPDATE',
      [supplierId]
    );
    if (supplierRows.length === 0) {
      const err = new Error('Supplier not found.');
      err.statusCode = 404;
      throw err;
    }

    // --- 2. Calculate the total on the server (never trust the client) ---
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.unit_cost;
    }
    totalAmount = Math.round(totalAmount * 100) / 100;

    // --- 3. Insert the purchase header ---------------------------------
    const [purchaseResult] = await connection.query(
      'INSERT INTO purchases (supplier_id, total_amount, status) VALUES (?, ?, ?)',
      [supplierId, totalAmount, 'COMPLETED']
    );
    const purchaseId = purchaseResult.insertId;

    // --- 4. Insert each line and increase stock --------------------------
    for (const item of items) {
      await connection.query(
        `INSERT INTO purchase_details
           (purchase_id, fruit_id, quantity, unit_cost, packaging_size)
         VALUES (?, ?, ?, ?, ?)`,
        [purchaseId, item.fruit_id, item.quantity, item.unit_cost, item.packaging_size]
      );

      // Make sure a stock row exists for this fruit + packaging size.
      await connection.query(
        `INSERT INTO stock (fruit_id, packaging_size, available_quantity, reorder_level)
         VALUES (?, ?, 0, 10)
         ON DUPLICATE KEY UPDATE fruit_id = fruit_id`,
        [item.fruit_id, item.packaging_size]
      );

      // Increase the stock bucket for this fruit + packaging size.
      await connection.query(
        `UPDATE stock
            SET available_quantity = available_quantity + ?
          WHERE fruit_id = ? AND packaging_size = ?`,
        [item.quantity, item.fruit_id, item.packaging_size]
      );
    }

    // --- 5. Save the calculated total ------------------------------------
    await connection.query(
      'UPDATE purchases SET total_amount = ? WHERE purchase_id = ?',
      [totalAmount, purchaseId]
    );

    // --- 6. Everything worked: save for real -----------------------------
    await connection.commit();

    return await findById(purchaseId);
  } catch (error) {
    // Something failed: undo every change made above.
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Cancel a purchase:
 * Reverses the stock added by the purchase inside an atomic transaction.
 * If any of the stock has already been sold and available quantity is too low,
 * the transaction is aborted and rolled back to prevent negative stock!
 */
async function cancel(purchaseId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Check purchase existence and status
    const [purchaseRows] = await connection.query(
      'SELECT purchase_id, status FROM purchases WHERE purchase_id = ? FOR UPDATE',
      [purchaseId]
    );

    if (purchaseRows.length === 0) {
      const err = new Error('Purchase not found.');
      err.statusCode = 404;
      throw err;
    }

    if (purchaseRows[0].status === 'CANCELLED') {
      const err = new Error('This purchase has already been cancelled.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Fetch the fruit items that were in this purchase
    const [itemRows] = await connection.query(
      `SELECT d.fruit_id, f.fruit_name, d.packaging_size, d.quantity
         FROM purchase_details d
         JOIN fruits f ON f.fruit_id = d.fruit_id
        WHERE d.purchase_id = ?`,
      [purchaseId]
    );

    // 3. Verify stock availability before decreasing
    for (const item of itemRows) {
      const [stockRows] = await connection.query(
        `SELECT available_quantity
           FROM stock
          WHERE fruit_id = ? AND packaging_size = ?
          FOR UPDATE`,
        [item.fruit_id, item.packaging_size]
      );

      const available = stockRows.length > 0 ? stockRows[0].available_quantity : 0;
      if (available < item.quantity) {
        const err = new Error(
          `Cannot cancel purchase #${purchaseId}: Some boxes of ${item.fruit_name} (${item.packaging_size}) have already been sold. ` +
          `Need to reverse ${item.quantity} box(es), but only ${available} box(es) remain in stock.`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    // 4. Safely deduct the stock back
    for (const item of itemRows) {
      await connection.query(
        `UPDATE stock
            SET available_quantity = available_quantity - ?
          WHERE fruit_id = ? AND packaging_size = ?`,
        [item.quantity, item.fruit_id, item.packaging_size]
      );
    }

    // 5. Update purchase status to CANCELLED
    await connection.query(
      `UPDATE purchases SET status = 'CANCELLED' WHERE purchase_id = ?`,
      [purchaseId]
    );

    // 6. Commit transaction
    await connection.commit();

    return await findById(purchaseId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { findAll, findById, create, cancel };

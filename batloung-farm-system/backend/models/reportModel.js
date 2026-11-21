// ---------------------------------------------------------------
// models/reportModel.js
// The FOUR required SQL reports. Each query is written out in full so
// it can be copied straight into the assignment document.
// ---------------------------------------------------------------
const { pool } = require('../config/db');

// ---------------------------------------------------------------
// REPORT 1 : the five most frequently sold fruits (by boxes sold)
// ---------------------------------------------------------------
async function topFruits() {
  const [rows] = await pool.query(
    `SELECT f.fruit_id,
            f.fruit_name,
            SUM(d.quantity)                AS boxes_sold,
            COUNT(DISTINCT d.sale_id)      AS times_sold,
            SUM(d.quantity * d.unit_price) AS revenue
       FROM sales_details d
       JOIN fruits f ON f.fruit_id = d.fruit_id
       JOIN sales  s ON s.sale_id  = d.sale_id
      GROUP BY f.fruit_id, f.fruit_name
      ORDER BY boxes_sold DESC
      LIMIT 5`
  );
  return rows;
}

// ---------------------------------------------------------------
// REPORT 2 : total sales revenue for a date range
// ---------------------------------------------------------------
async function revenueByDateRange(startDate, endDate) {
  const [summaryRows] = await pool.query(
    `SELECT COALESCE(SUM(d.quantity * d.unit_price), 0) AS total_revenue,
            COUNT(DISTINCT s.sale_id)                  AS number_of_sales,
            COALESCE(SUM(d.quantity), 0)               AS boxes_sold
       FROM sales s
       JOIN sales_details d ON d.sale_id = s.sale_id
      WHERE DATE(s.sale_date) BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [dailyRows] = await pool.query(
    `SELECT DATE(s.sale_date)              AS sale_day,
            COUNT(DISTINCT s.sale_id)      AS number_of_sales,
            SUM(d.quantity)                AS boxes_sold,
            SUM(d.quantity * d.unit_price) AS revenue
       FROM sales s
       JOIN sales_details d ON d.sale_id = s.sale_id
      WHERE DATE(s.sale_date) BETWEEN ? AND ?
      GROUP BY DATE(s.sale_date)
      ORDER BY sale_day`,
    [startDate, endDate]
  );

  return {
    start_date: startDate,
    end_date: endDate,
    total_revenue: summaryRows[0].total_revenue,
    number_of_sales: summaryRows[0].number_of_sales,
    boxes_sold: summaryRows[0].boxes_sold,
    daily: dailyRows,
  };
}

// ---------------------------------------------------------------
// REPORT 3 : the vendor who purchased the highest number of boxes
// ---------------------------------------------------------------
async function topVendor() {
  const [rows] = await pool.query(
    `SELECT v.vendor_id,
            v.vendor_name,
            v.phone_number,
            v.location,
            SUM(d.quantity)                AS total_boxes,
            COUNT(DISTINCT s.sale_id)      AS number_of_purchases,
            SUM(d.quantity * d.unit_price) AS total_spent
       FROM sales s
       JOIN sales_details d ON d.sale_id = s.sale_id
       JOIN vendors v       ON v.vendor_id = s.vendor_id
      GROUP BY v.vendor_id, v.vendor_name, v.phone_number, v.location
      ORDER BY total_boxes DESC, total_spent DESC
      LIMIT 1`
  );
  return rows[0] || null;
}

// ---------------------------------------------------------------
// REPORT 4 : current stock for each fruit and packaging size
// ---------------------------------------------------------------
async function currentStock() {
  const [rows] = await pool.query(
    `SELECT f.fruit_id,
            f.fruit_name,
            s.packaging_size,
            s.available_quantity,
            s.reorder_level,
            CASE WHEN s.available_quantity = 0                THEN 'OUT_OF_STOCK'
                 WHEN s.available_quantity <= s.reorder_level THEN 'LOW'
                 ELSE 'OK' END                            AS stock_status
       FROM stock s
       JOIN fruits f ON f.fruit_id = s.fruit_id
      ORDER BY f.fruit_name,
               FIELD(s.packaging_size, 'SMALL', 'MEDIUM', 'LARGE')`
  );
  return rows;
}

// ---------------------------------------------------------------
// Dashboard totals (one query, all six cards)
// ---------------------------------------------------------------
async function dashboard() {
  const [rows] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM suppliers)                          AS total_suppliers,
            (SELECT COUNT(*) FROM vendors)                            AS total_vendors,
            (SELECT COUNT(*) FROM fruits WHERE status = 'ACTIVE')     AS total_fruits,
            (SELECT COALESCE(SUM(available_quantity), 0) FROM stock)  AS total_stock_boxes,
            (SELECT COALESCE(SUM(total_amount), 0) FROM sales)        AS total_sales_revenue,
            (SELECT COALESCE(SUM(outstanding_balance), 0) FROM sales) AS total_outstanding_balance,
            (SELECT COUNT(*) FROM stock WHERE available_quantity <= reorder_level) AS low_stock_count`
  );
  return rows[0];
}

module.exports = { topFruits, revenueByDateRange, topVendor, currentStock, dashboard };

// pages/Reports.jsx — SQL Reporting Queries (Part D of Assignment)
import { useState, useEffect } from 'react';
import { reportService } from '../services/reports';
import { useCurrency } from '../context/CurrencyContext';
import DataTable from '../components/DataTable';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';

export default function Reports() {
  const [activeReport, setActiveReport] = useState('top-fruits'); // 'top-fruits' | 'revenue' | 'top-vendor' | 'stock'
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const { formatMoney } = useCurrency();

  // Report 1 state
  const [topFruits, setTopFruits] = useState([]);

  // Report 2 state
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [revenueData, setRevenueData] = useState(null);

  // Report 3 state
  const [topVendor, setTopVendor] = useState(null);

  // Report 4 state
  const [stockReport, setStockReport] = useState([]);

  useEffect(() => {
    loadActiveReport();
  }, [activeReport]);

  async function loadActiveReport() {
    setLoading(true);
    setAlert({ type: '', message: '' });

    try {
      if (activeReport === 'top-fruits') {
        const res = await reportService.topFruits();
        setTopFruits(res.data || []);
      } else if (activeReport === 'revenue') {
        const res = await reportService.revenue(startDate, endDate);
        setRevenueData(res.data || null);
      } else if (activeReport === 'top-vendor') {
        const res = await reportService.topVendor();
        setTopVendor(res.data || null);
      } else if (activeReport === 'stock') {
        const res = await reportService.stock();
        setStockReport(res.data || []);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to fetch report data.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleFilterRevenue(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await reportService.revenue(startDate, endDate);
      setRevenueData(res.data || null);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to fetch revenue report.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Business Intelligence & SQL Reports</h2>
          <p className="muted">
            The 4 required SQL analytical queries from Part D of the DIWA2110 specification
          </p>
        </div>
      </header>

      {alert.message && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}

      <div className="card">
        <div className="toolbar" style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className={'btn ' + (activeReport === 'top-fruits' ? 'btn-primary' : 'btn-ghost')}
            onClick={() => setActiveReport('top-fruits')}
          >
            1. Top 5 Sold Fruits
          </button>
          <button
            type="button"
            className={'btn ' + (activeReport === 'revenue' ? 'btn-primary' : 'btn-ghost')}
            onClick={() => setActiveReport('revenue')}
          >
            2. Revenue by Date Range
          </button>
          <button
            type="button"
            className={'btn ' + (activeReport === 'top-vendor' ? 'btn-primary' : 'btn-ghost')}
            onClick={() => setActiveReport('top-vendor')}
          >
            3. Top Performing Vendor
          </button>
          <button
            type="button"
            className={'btn ' + (activeReport === 'stock' ? 'btn-primary' : 'btn-ghost')}
            onClick={() => setActiveReport('stock')}
          >
            4. Current Stock Levels
          </button>
        </div>

        {/* REPORT 1: Top 5 Fruits */}
        {activeReport === 'top-fruits' && (
          <div>
            <h3>Report 1: Top 5 Most Frequently Sold Fruits</h3>
            <p className="muted" style={{ marginBottom: '16px' }}>
              Ranked by total quantity of boxes sold across all transactions
            </p>

            <DataTable
              columns={[
                {
                  key: 'rank',
                  label: '#',
                  render: (row) => <strong>{topFruits.indexOf(row) + 1}</strong>,
                },
                { key: 'fruit_name', label: 'Fruit Variety' },
                {
                  key: 'boxes_sold',
                  label: 'Total Boxes Sold',
                  render: (r) => <strong>{r.boxes_sold} boxes</strong>,
                },
                { key: 'times_sold', label: 'Number of Transactions' },
                {
                  key: 'revenue',
                  label: 'Generated Revenue',
                  render: (r) => formatMoney(r.revenue),
                },
              ]}
              rows={topFruits}
              loading={loading}
              emptyText="No fruit sales recorded yet."
            />
          </div>
        )}

        {/* REPORT 2: Sales Revenue by Date Range */}
        {activeReport === 'revenue' && (
          <div>
            <h3>Report 2: Total Sales Revenue by Date Range</h3>
            <p className="muted" style={{ marginBottom: '16px' }}>
              Calculate total revenue, transaction counts, and boxes sold within custom dates
            </p>

            <form onSubmit={handleFilterRevenue} className="toolbar" style={{ marginBottom: '18px' }}>
              <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <span>From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </label>

              <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <span>To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </label>

              <button type="submit" className="btn btn-secondary">
                Generate Report
              </button>
            </form>

            {revenueData && (
              <>
                <div className="stat-grid" style={{ marginBottom: '20px' }}>
                  <div className="stat-card">
                    <div>
                      <p className="stat-label">Total Revenue</p>
                      <p className="stat-value" style={{ color: 'var(--green-700)' }}>
                        {formatMoney(revenueData.total_revenue)}
                      </p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div>
                      <p className="stat-label">Total Boxes Sold</p>
                      <p className="stat-value">{revenueData.boxes_sold || 0} boxes</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div>
                      <p className="stat-label">Total Transactions</p>
                      <p className="stat-value">{revenueData.number_of_sales || 0}</p>
                    </div>
                  </div>
                </div>

                <h4>Daily Sales Breakdown</h4>
                <DataTable
                  columns={[
                    {
                      key: 'sale_day',
                      label: 'Date',
                      render: (d) => (d.sale_day ? d.sale_day.slice(0, 10) : '-'),
                    },
                    { key: 'number_of_sales', label: 'Transactions' },
                    { key: 'boxes_sold', label: 'Boxes Sold' },
                    {
                      key: 'revenue',
                      label: 'Day Revenue',
                      render: (d) => <strong>{formatMoney(d.revenue)}</strong>,
                    },
                  ]}
                  rows={revenueData.daily || []}
                  loading={loading}
                  emptyText="No sales recorded in this date range."
                />
              </>
            )}
          </div>
        )}

        {/* REPORT 3: Top Purchasing Vendor */}
        {activeReport === 'top-vendor' && (
          <div>
            <h3>Report 3: Vendor with the Highest Number of Boxes Purchased</h3>
            <p className="muted" style={{ marginBottom: '16px' }}>
              Identifies the primary retail customer based on cumulative volume of fruit boxes
            </p>

            {loading ? (
              <p className="muted">Calculating top vendor...</p>
            ) : topVendor ? (
              <div
                className="card"
                style={{
                  background: 'var(--bg)',
                  maxWidth: '560px',
                  border: '2px solid var(--green-500)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--green-500)',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '1.4rem',
                    }}
                  >
                    🏆
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem' }}>{topVendor.vendor_name}</h3>
                    <p className="muted">
                      {topVendor.location} &bull; {topVendor.phone_number}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#fff', padding: '12px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Total Boxes Purchased
                    </span>
                    <p style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green-700)' }}>
                      {topVendor.total_boxes} boxes
                    </p>
                  </div>

                  <div style={{ background: '#fff', padding: '12px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Total Amount Spent
                    </span>
                    <p style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                      {formatMoney(topVendor.total_spent)}
                    </p>
                  </div>

                  <div style={{ background: '#fff', padding: '12px', borderRadius: '10px', gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Completed Orders
                    </span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                      {topVendor.number_of_purchases} separate purchases recorded
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="muted">No sales data available to determine top vendor.</p>
            )}
          </div>
        )}

        {/* REPORT 4: Current Stock for each Fruit & Packaging Size */}
        {activeReport === 'stock' && (
          <div>
            <h3>Report 4: Current Stock Levels for Each Fruit & Packaging Size</h3>
            <p className="muted" style={{ marginBottom: '16px' }}>
              Full inventory breakdown distinguishing Small, Medium, and Large packaging sizes
            </p>

            <DataTable
              columns={[
                { key: 'fruit_name', label: 'Fruit Variety' },
                {
                  key: 'packaging_size',
                  label: 'Packaging Size',
                  render: (r) => <strong>{r.packaging_size}</strong>,
                },
                {
                  key: 'available_quantity',
                  label: 'Available Quantity',
                  render: (r) => (
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          r.available_quantity === 0
                            ? 'var(--red)'
                            : r.available_quantity <= r.reorder_level
                            ? 'var(--amber)'
                            : 'var(--green-700)',
                      }}
                    >
                      {r.available_quantity} boxes
                    </span>
                  ),
                },
                {
                  key: 'reorder_level',
                  label: 'Reorder Level',
                  render: (r) => r.reorder_level + ' boxes',
                },
                {
                  key: 'stock_status',
                  label: 'Status',
                  render: (r) => <StatusBadge status={r.stock_status} />,
                },
              ]}
              rows={stockReport}
              loading={loading}
              emptyText="No stock records found."
            />
          </div>
        )}
      </div>
    </section>
  );
}

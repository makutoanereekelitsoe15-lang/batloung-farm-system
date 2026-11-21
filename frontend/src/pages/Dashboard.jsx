// pages/Dashboard.jsx — Overview Dashboard with Live Available Stock
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../services/reports';
import { stockService } from '../services/fruits';
import { useCurrency } from '../context/CurrencyContext';
import StatCard from '../components/StatCard';
import Alert from '../components/Alert';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { formatMoney } = useCurrency();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const [dashRes, stockRes] = await Promise.all([
        reportService.dashboard(),
        stockService.getAll(),
      ]);
      if (dashRes && dashRes.data) {
        setSummary(dashRes.data);
      }
      setStockList(stockRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  // Aggregate stock by fruit for the overview table
  const fruitStockMap = {};
  stockList.forEach((item) => {
    if (!fruitStockMap[item.fruit_id]) {
      fruitStockMap[item.fruit_id] = {
        fruit_id: item.fruit_id,
        fruit_name: item.fruit_name,
        small: 0,
        medium: 0,
        large: 0,
        total: 0,
        hasLow: false,
      };
    }
    const size = (item.packaging_size || '').toLowerCase();
    fruitStockMap[item.fruit_id][size] = item.available_quantity;
    fruitStockMap[item.fruit_id].total += item.available_quantity;
    if (item.available_quantity <= item.reorder_level) {
      fruitStockMap[item.fruit_id].hasLow = true;
    }
  });

  const stockOverviewRows = Object.values(fruitStockMap);

  const stockColumns = [
    { key: 'fruit_name', label: 'Fruit Variety' },
    {
      key: 'small',
      label: 'Small Boxes',
      render: (r) => (
        <span style={{ fontWeight: 600, color: r.small === 0 ? 'var(--red)' : 'inherit' }}>
          {r.small} box(es)
        </span>
      ),
    },
    {
      key: 'medium',
      label: 'Medium Boxes',
      render: (r) => (
        <span style={{ fontWeight: 600, color: r.medium === 0 ? 'var(--red)' : 'inherit' }}>
          {r.medium} box(es)
        </span>
      ),
    },
    {
      key: 'large',
      label: 'Large Boxes',
      render: (r) => (
        <span style={{ fontWeight: 600, color: r.large === 0 ? 'var(--red)' : 'inherit' }}>
          {r.large} box(es)
        </span>
      ),
    },
    {
      key: 'total',
      label: 'Total Available',
      render: (r) => (
        <strong style={{ color: 'var(--green-700)', fontSize: '0.96rem' }}>
          {r.total} boxes
        </strong>
      ),
    },
    {
      key: 'hasLow',
      label: 'Health',
      render: (r) => (
        <StatusBadge status={r.total === 0 ? 'OUT_OF_STOCK' : r.hasLow ? 'LOW' : 'OK'} />
      ),
    },
  ];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Batloung Farm Dashboard</h2>
          <p className="muted">Fresh produce distribution management overview (Maseru, Lesotho)</p>
        </div>
        <button className="btn btn-secondary btn-small" onClick={loadDashboard}>
          Refresh
        </button>
      </header>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {loading ? (
        <p className="muted">Loading dashboard statistics & stock inventory...</p>
      ) : summary ? (
        <>
          {summary.low_stock_count > 0 && (
            <div className="alert alert-error">
              <span>
                <strong>Warning:</strong> {summary.low_stock_count} fruit item(s) are at or below reorder level.
              </span>
              <Link to="/stock" className="btn btn-small btn-secondary">
                View Low Stock
              </Link>
            </div>
          )}

          <div className="stat-grid">
            <StatCard
              icon="🍎"
              label="Active Fruits"
              value={summary.total_fruits ?? 0}
              hint="Fruit types in catalogue"
              tone="green"
            />
            <StatCard
              icon="📦"
              label="Stock Available"
              value={(summary.total_stock_boxes ?? 0) + ' boxes'}
              hint="Across all packaging sizes"
              tone="green"
            />
            <StatCard
              icon="🏭"
              label="Registered Suppliers"
              value={summary.total_suppliers ?? 0}
              hint="South African provinces"
              tone="neutral"
            />
            <StatCard
              icon="🧺"
              label="Registered Vendors"
              value={summary.total_vendors ?? 0}
              hint="Retailers in Lesotho"
              tone="neutral"
            />
            <StatCard
              icon="🧾"
              label="Sales Revenue"
              value={formatMoney(summary.total_sales_revenue)}
              hint="Total sales recorded"
              tone="green"
            />
            <StatCard
              icon="💳"
              label="Outstanding Credit"
              value={formatMoney(summary.total_outstanding_balance)}
              hint="Unpaid vendor balances"
              tone={Number(summary.total_outstanding_balance || 0) > 0 ? 'amber' : 'green'}
            />
          </div>

          {/* Real-time Available Stock Table */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <h3>📦 Real-Time Available Stock by Packaging Size</h3>
                <p className="muted" style={{ fontSize: '0.84rem' }}>
                  Live warehouse stock breakdown for Small, Medium, and Large boxes
                </p>
              </div>
              <Link to="/stock" className="btn btn-secondary btn-small">
                Manage Stock & Reorders &rarr;
              </Link>
            </div>

            <DataTable
              columns={stockColumns}
              rows={stockOverviewRows}
              emptyText="No stock inventory recorded."
            />
          </div>

          <div className="card">
            <h3>Quick Actions</h3>
            <p className="muted" style={{ marginBottom: '16px' }}>
              Common daily tasks for the administrator
            </p>
            <div className="toolbar">
              <Link to="/sales" className="btn btn-primary">
                + Record New Sale
              </Link>
              <Link to="/purchases" className="btn btn-secondary">
                + Record Supplier Purchase
              </Link>
              <Link to="/stock" className="btn btn-secondary">
                📦 View All Stock Levels
              </Link>
              <Link to="/vendors" className="btn btn-ghost">
                + Register Vendor
              </Link>
              <Link to="/payments" className="btn btn-ghost">
                Manage Vendor Payments
              </Link>
              <Link to="/reports" className="btn btn-ghost">
                View SQL Reports
              </Link>
            </div>
          </div>
        </>
      ) : (
        <p className="muted">No summary data available.</p>
      )}
    </section>
  );
}

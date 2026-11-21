import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../services/reports';
import StatCard from '../components/StatCard';
import Alert from '../components/Alert';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const response = await reportService.dashboard();
      if (response && response.data) {
        setSummary(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

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
        <p className="muted">Loading dashboard statistics...</p>
      ) : summary ? (
        <>
          {summary.low_stock_count > 0 && (
            <div className="alert alert-error">
              <span>
                <strong>Warning:</strong> {summary.low_stock_count} fruit item(s) are at or below reorder level.
              </span>
              <Link to="/stock" className="btn btn-small btn-secondary">
                View Stock
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
              value={'R ' + Number(summary.total_sales_revenue || 0).toFixed(2)}
              hint="Total sales recorded"
              tone="green"
            />
            <StatCard
              icon="💳"
              label="Outstanding Credit"
              value={'R ' + Number(summary.total_outstanding_balance || 0).toFixed(2)}
              hint="Unpaid vendor balances"
              tone={Number(summary.total_outstanding_balance || 0) > 0 ? 'amber' : 'green'}
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

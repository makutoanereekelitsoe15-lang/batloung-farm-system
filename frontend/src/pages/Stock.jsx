// pages/Stock.jsx — Fruit Stock by Packaging Size with Quick Reorder
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stockService } from '../services/fruits';
import DataTable from '../components/DataTable';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';

export default function Stock() {
  const [stock, setStock] = useState([]);
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadStock();
  }, [showLowOnly]);

  async function loadStock() {
    setLoading(true);
    try {
      const res = showLowOnly ? await stockService.getLow() : await stockService.getAll();
      setStock(res.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to load stock data.' });
    } finally {
      setLoading(false);
    }
  }

  // Quick reorder shortcut: navigates to Purchases with pre-filled fruit & size
  function handleQuickReorder(item) {
    navigate('/purchases', {
      state: {
        reorderFruitId: item.fruit_id,
        reorderFruitName: item.fruit_name,
        reorderPackagingSize: item.packaging_size,
      },
    });
  }

  const totalBoxes = stock.reduce((sum, item) => sum + (Number(item.available_quantity) || 0), 0);
  const lowCount = stock.filter(
    (item) => item.available_quantity <= item.reorder_level && item.available_quantity > 0
  ).length;
  const outOfStockCount = stock.filter((item) => item.available_quantity === 0).length;

  const columns = [
    { key: 'fruit_name', label: 'Fruit Variety' },
    {
      key: 'packaging_size',
      label: 'Packaging Size',
      render: (s) => <strong>{s.packaging_size}</strong>,
    },
    {
      key: 'available_quantity',
      label: 'Available Stock (Boxes)',
      render: (s) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: '1rem',
            color:
              s.available_quantity === 0
                ? 'var(--red)'
                : s.available_quantity <= s.reorder_level
                ? 'var(--amber)'
                : 'var(--green-700)',
          }}
        >
          {s.available_quantity} boxes
        </span>
      ),
    },
    {
      key: 'reorder_level',
      label: 'Reorder Level',
      render: (s) => s.reorder_level + ' boxes',
    },
    {
      key: 'stock_status',
      label: 'Stock Health',
      render: (s) => {
        let status = 'OK';
        if (s.available_quantity === 0) status = 'OUT_OF_STOCK';
        else if (s.available_quantity <= s.reorder_level) status = 'LOW';
        return <StatusBadge status={status} />;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (s) => {
        const isLow = s.available_quantity <= s.reorder_level;
        return (
          <button
            type="button"
            className={'btn btn-small ' + (isLow ? 'btn-primary' : 'btn-ghost')}
            onClick={() => handleQuickReorder(s)}
            title="Create a new purchase order for this fruit"
          >
            🛒 Reorder &rarr;
          </button>
        );
      },
    },
  ];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Stock Level Management</h2>
          <p className="muted">
            Separate stock balances maintained for Small, Medium, and Large packaging sizes with One-Click Reorder
          </p>
        </div>
        <button className="btn btn-secondary btn-small" onClick={loadStock}>
          Refresh Stock
        </button>
      </header>

      {alert.message && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}

      <div className="stat-grid">
        <StatCard
          icon="📦"
          label="Total Boxes Listed"
          value={totalBoxes + ' boxes'}
          hint="Current inventory on hand"
          tone="green"
        />
        <StatCard
          icon="⚠️"
          label="Low Stock Warnings"
          value={lowCount}
          hint="At or below reorder level"
          tone={lowCount > 0 ? 'amber' : 'neutral'}
        />
        <StatCard
          icon="❌"
          label="Out of Stock Items"
          value={outOfStockCount}
          hint="Zero boxes remaining"
          tone={outOfStockCount > 0 ? 'red' : 'neutral'}
        />
      </div>

      <div className="card">
        <div className="toolbar" style={{ marginBottom: '16px' }}>
          <span>View:</span>
          <button
            type="button"
            className={'btn btn-small ' + (!showLowOnly ? 'btn-primary' : 'btn-ghost')}
            onClick={() => setShowLowOnly(false)}
          >
            All Packaging Sizes & Fruits
          </button>
          <button
            type="button"
            className={'btn btn-small ' + (showLowOnly ? 'btn-primary' : 'btn-ghost')}
            onClick={() => setShowLowOnly(true)}
          >
            Low Stock Alerts Only (≤ Reorder Level)
          </button>
        </div>

        <DataTable
          columns={columns}
          rows={stock}
          loading={loading}
          emptyText="No stock items found."
        />
      </div>
    </section>
  );
}

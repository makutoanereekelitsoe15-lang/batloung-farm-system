// pages/Purchases.jsx — Supplier Purchases Management with Cancellation & Quick Reorder
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { purchaseService } from '../services/purchases';
import { supplierService } from '../services/suppliers';
import { fruitService } from '../services/fruits';
import { useCurrency } from '../context/CurrencyContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';
import LineItemEditor from '../components/LineItemEditor';

const defaultLineItem = {
  fruit_id: '',
  packaging_size: 'MEDIUM',
  quantity: 1,
  unit_cost: '',
};

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [fruits, setFruits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const { currency, formatMoney } = useCurrency();
  const location = useLocation();

  // Record modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [items, setItems] = useState([{ ...defaultLineItem }]);
  const [saving, setSaving] = useState(false);

  // View detail modal
  const [viewingPurchase, setViewingPurchase] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [purchasesRes, suppliersRes, fruitsRes] = await Promise.all([
        purchaseService.getAll(),
        supplierService.getAll(),
        fruitService.getAll(),
      ]);
      const supList = suppliersRes.data || [];
      const fruitList = fruitsRes.data || [];
      setPurchases(purchasesRes.data || []);
      setSuppliers(supList);
      setFruits(fruitList);

      // Check if arriving from Quick Reorder in Stock page
      if (location.state && location.state.reorderFruitId) {
        setSelectedSupplierId(supList.length > 0 ? supList[0].supplier_id : '');
        setItems([
          {
            fruit_id: String(location.state.reorderFruitId),
            packaging_size: location.state.reorderPackagingSize || 'MEDIUM',
            quantity: 20,
            unit_cost: '',
          },
        ]);
        setIsRecordModalOpen(true);
        setAlert({
          type: 'info',
          message: `⚡ Quick Reorder activated for ${
            location.state.reorderFruitName || 'selected fruit'
          } (${location.state.reorderPackagingSize || 'MEDIUM'}). Choose your supplier and unit cost.`,
        });
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to load purchase records.' });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenRecord() {
    setSelectedSupplierId(suppliers.length > 0 ? suppliers[0].supplier_id : '');
    setItems([{ ...defaultLineItem }]);
    setIsRecordModalOpen(true);
  }

  async function handleRecordSubmit(e) {
    e.preventDefault();
    if (!selectedSupplierId) {
      setAlert({ type: 'error', message: 'Please select a supplier.' });
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].fruit_id) {
        setAlert({ type: 'error', message: `Please select a fruit for line ${i + 1}.` });
        return;
      }
      if (!items[i].unit_cost || Number(items[i].unit_cost) <= 0) {
        setAlert({ type: 'error', message: `Please enter a valid unit cost for line ${i + 1}.` });
        return;
      }
    }

    setSaving(true);
    setAlert({ type: '', message: '' });

    try {
      const payload = {
        supplier_id: Number(selectedSupplierId),
        items: items.map((it) => ({
          fruit_id: Number(it.fruit_id),
          packaging_size: it.packaging_size,
          quantity: Number(it.quantity),
          unit_cost: Number(it.unit_cost),
        })),
      };

      const res = await purchaseService.create(payload);
      setAlert({
        type: 'success',
        message: res.message || 'Purchase recorded successfully and stock updated.',
      });
      setIsRecordModalOpen(false);
      loadInitialData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to record purchase.' });
    } finally {
      setSaving(false);
    }
  }

  // Cancel purchase and reverse stock
  async function handleCancelPurchase(purchase) {
    const confirmed = window.confirm(
      `Are you sure you want to CANCEL Purchase #${purchase.purchase_id}?\n\n` +
      `This will safely deduct the purchased stock from inventory. If any boxes have already been sold, the cancellation will be rejected.`
    );
    if (!confirmed) return;

    setLoading(true);
    setAlert({ type: '', message: '' });

    try {
      const res = await purchaseService.cancel(purchase.purchase_id);
      setAlert({
        type: 'success',
        message: res.message || `Purchase #${purchase.purchase_id} was successfully cancelled and stock reversed.`,
      });
      if (viewingPurchase && viewingPurchase.purchase_id === purchase.purchase_id) {
        setViewingPurchase(null);
      }
      loadInitialData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || `Could not cancel purchase #${purchase.purchase_id}.`,
      });
      setLoading(false);
    }
  }

  async function handleViewDetails(purchaseId) {
    try {
      const res = await purchaseService.getOne(purchaseId);
      setViewingPurchase(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: 'Could not load details for purchase #' + purchaseId });
    }
  }

  const columns = [
    { key: 'purchase_id', label: 'Purchase #' },
    { key: 'business_name', label: 'Supplier (Origin)' },
    { key: 'province', label: 'Province' },
    {
      key: 'purchase_date',
      label: 'Purchase Date',
      render: (p) => (p.purchase_date ? p.purchase_date.slice(0, 10) : '-'),
    },
    { key: 'total_boxes', label: 'Total Boxes' },
    {
      key: 'total_amount',
      label: 'Total Amount',
      render: (p) => <strong>{formatMoney(p.total_amount)}</strong>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => <StatusBadge status={p.status || 'COMPLETED'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (p) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-ghost btn-small"
            onClick={() => handleViewDetails(p.purchase_id)}
          >
            View Items
          </button>
          {p.status !== 'CANCELLED' && (
            <button
              className="btn btn-danger btn-small"
              onClick={() => handleCancelPurchase(p)}
              title="Cancel purchase and reverse stock"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Supplier Purchase Management</h2>
          <p className="muted">
            Record fresh produce batches purchased from South African suppliers with automatic stock adjustment and safe cancellation
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenRecord}>
          + Record New Purchase
        </button>
      </header>

      {alert.message && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}

      <div className="card">
        <DataTable
          columns={columns}
          rows={purchases}
          loading={loading}
          emptyText="No purchases recorded yet."
        />
      </div>

      {/* Record Purchase Modal */}
      {isRecordModalOpen && (
        <Modal title="Record Supplier Purchase" onClose={() => setIsRecordModalOpen(false)}>
          <form onSubmit={handleRecordSubmit}>
            <div className="form-grid" style={{ marginBottom: '18px' }}>
              <label className="full">
                Select Supplier (South Africa)
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.business_name} ({s.province})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <h4 style={{ marginBottom: '8px' }}>Fruit Items in this Batch</h4>
            <LineItemEditor
              items={items}
              setItems={setItems}
              fruits={fruits}
              priceKey="unit_cost"
              priceLabel={`Unit Cost (${currency})`}
              showStock={false}
            />

            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsRecordModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Confirm & Save Purchase'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Purchase Details Modal */}
      {viewingPurchase && (
        <Modal
          title={`Purchase #${viewingPurchase.purchase_id} Details`}
          onClose={() => setViewingPurchase(null)}
        >
          {viewingPurchase.status === 'CANCELLED' && (
            <div className="alert alert-error" style={{ marginBottom: '14px' }}>
              <span>⚠️ This purchase has been <strong>CANCELLED</strong>. The stock was reversed from inventory.</span>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <p>
              <strong>Supplier:</strong> {viewingPurchase.business_name || viewingPurchase.supplier_name} ({viewingPurchase.province})
            </p>
            <p>
              <strong>Contact:</strong> {viewingPurchase.contact_person || 'N/A'}
            </p>
            <p>
              <strong>Date:</strong> {viewingPurchase.purchase_date?.slice(0, 10)}
            </p>
            <p>
              <strong>Status:</strong> <StatusBadge status={viewingPurchase.status || 'COMPLETED'} />
            </p>
            <p>
              <strong>Grand Total:</strong> {formatMoney(viewingPurchase.total_amount)}
            </p>
          </div>

          <table style={{ width: '100%', marginBottom: '16px' }}>
            <thead>
              <tr>
                <th>Fruit</th>
                <th>Packaging Size</th>
                <th>Quantity (Boxes)</th>
                <th>Unit Cost</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(viewingPurchase.items || []).map((it, idx) => (
                <tr key={idx}>
                  <td>{it.fruit_name}</td>
                  <td>{it.packaging_size}</td>
                  <td>{it.quantity}</td>
                  <td>{formatMoney(it.unit_cost)}</td>
                  <td>{formatMoney(it.line_total || it.quantity * it.unit_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between' }}>
            {viewingPurchase.status !== 'CANCELLED' ? (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleCancelPurchase(viewingPurchase)}
              >
                Cancel this Purchase
              </button>
            ) : <span />}
            <button className="btn btn-secondary" onClick={() => setViewingPurchase(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

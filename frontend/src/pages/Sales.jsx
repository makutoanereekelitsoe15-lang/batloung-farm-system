// pages/Sales.jsx — Vendor Sales Management with Printable Invoice & Receipts
import { useState, useEffect } from 'react';
import { saleService } from '../services/sales';
import { vendorService } from '../services/vendors';
import { fruitService, stockService } from '../services/fruits';
import { useCurrency } from '../context/CurrencyContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';
import LineItemEditor from '../components/LineItemEditor';
import ReceiptModal from '../components/ReceiptModal';

const defaultLineItem = {
  fruit_id: '',
  packaging_size: 'MEDIUM',
  quantity: 1,
  unit_price: '',
};

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [fruits, setFruits] = useState([]);
  const [stock, setStock] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const { currency, formatMoney } = useCurrency();

  // Record modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [items, setItems] = useState([{ ...defaultLineItem }]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [saving, setSaving] = useState(false);

  // View details modal & Printable receipt modal
  const [viewingSale, setViewingSale] = useState(null);
  const [printingSale, setPrintingSale] = useState(null);

  useEffect(() => {
    loadSales(filterStatus);
    loadFormData();
  }, [filterStatus]);

  async function loadSales(status = '') {
    setLoading(true);
    try {
      const res = await saleService.getAll(status);
      setSales(res.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Could not load sales.' });
    } finally {
      setLoading(false);
    }
  }

  async function loadFormData() {
    try {
      const [vendorsRes, fruitsRes, stockRes] = await Promise.all([
        vendorService.getAll(),
        fruitService.getAll(),
        stockService.getAll(),
      ]);
      setVendors(vendorsRes.data || []);
      setFruits(fruitsRes.data || []);
      setStock(stockRes.data || []);
    } catch (err) {
      // Background load error
    }
  }

  function handleOpenRecord() {
    loadFormData();
    setSelectedVendorId(vendors.length > 0 ? vendors[0].vendor_id : '');
    setItems([{ ...defaultLineItem }]);
    setPaymentMethod('CASH');
    setAmountPaid('');
    setPaymentRef('');
    setIsRecordModalOpen(true);
  }

  const totalAmount = items.reduce((sum, it) => {
    return sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
  }, 0);

  async function handleRecordSubmit(e) {
    e.preventDefault();
    if (!selectedVendorId) {
      setAlert({ type: 'error', message: 'Please select a vendor.' });
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].fruit_id) {
        setAlert({ type: 'error', message: `Please select a fruit for line ${i + 1}.` });
        return;
      }
      if (!items[i].unit_price || Number(items[i].unit_price) <= 0) {
        setAlert({ type: 'error', message: `Please enter a valid selling price for line ${i + 1}.` });
        return;
      }
    }

    setSaving(true);
    setAlert({ type: '', message: '' });

    try {
      const payload = {
        vendor_id: Number(selectedVendorId),
        items: items.map((it) => ({
          fruit_id: Number(it.fruit_id),
          packaging_size: it.packaging_size,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
        payment: {
          payment_method: paymentMethod,
          amount_paid: amountPaid !== '' ? Number(amountPaid) : totalAmount,
          reference: paymentRef,
        },
      };

      const res = await saleService.create(payload);
      setAlert({
        type: 'success',
        message: res.message || 'Sale recorded and stock updated successfully.',
      });
      setIsRecordModalOpen(false);
      loadSales(filterStatus);
      // Prompt user with newly generated receipt
      if (res.data) {
        setPrintingSale(res.data);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to record sale.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleViewDetails(saleId) {
    try {
      const res = await saleService.getOne(saleId);
      setViewingSale(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: 'Could not load details for sale #' + saleId });
    }
  }

  async function handleOpenReceipt(saleId) {
    try {
      const res = await saleService.getOne(saleId);
      setPrintingSale(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: 'Could not load receipt for sale #' + saleId });
    }
  }

  const columns = [
    { key: 'sale_id', label: 'Sale #' },
    { key: 'vendor_name', label: 'Vendor' },
    { key: 'phone_number', label: 'Phone' },
    {
      key: 'sale_date',
      label: 'Date',
      render: (s) => (s.sale_date ? s.sale_date.slice(0, 10) : '-'),
    },
    { key: 'total_boxes', label: 'Boxes' },
    {
      key: 'total_amount',
      label: 'Total Amount',
      render: (s) => <strong>{formatMoney(s.total_amount)}</strong>,
    },
    {
      key: 'amount_paid',
      label: 'Amount Paid',
      render: (s) => formatMoney(s.amount_paid),
    },
    {
      key: 'outstanding_balance',
      label: 'Balance',
      render: (s) => (
        <span
          style={{
            color: Number(s.outstanding_balance) > 0 ? 'var(--red)' : 'inherit',
            fontWeight: Number(s.outstanding_balance) > 0 ? 600 : 400,
          }}
        >
          {formatMoney(s.outstanding_balance)}
        </span>
      ),
    },
    {
      key: 'payment_status',
      label: 'Status',
      render: (s) => <StatusBadge status={s.payment_status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (s) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-ghost btn-small"
            onClick={() => handleViewDetails(s.sale_id)}
          >
            Details
          </button>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => handleOpenReceipt(s.sale_id)}
            title="Generate & print official receipt"
          >
            🖨️ Receipt
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Sales Management</h2>
          <p className="muted">
            Record sales to street vendors with automated total calculation, atomic stock reduction, and official printable receipts
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenRecord}>
          + Record New Sale
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
        <div className="toolbar" style={{ marginBottom: '16px' }}>
          <span>Filter by payment status:</span>
          <button
            type="button"
            className={'btn btn-small ' + (filterStatus === '' ? 'btn-primary' : 'btn-ghost')}
            onClick={() => setFilterStatus('')}
          >
            All Sales
          </button>
          <button
            type="button"
            className={'btn btn-small ' + (filterStatus === 'UNPAID' ? 'btn-primary' : 'btn-ghost')}
            onClick={() => setFilterStatus('UNPAID')}
          >
            Unpaid (Credit)
          </button>
          <button
            type="button"
            className={'btn btn-small ' + (filterStatus === 'PARTIALLY_PAID' ? 'btn-primary' : 'btn-ghost')}
            onClick={() => setFilterStatus('PARTIALLY_PAID')}
          >
            Partially Paid
          </button>
          <button
            type="button"
            className={'btn btn-small ' + (filterStatus === 'PAID' ? 'btn-primary' : 'btn-ghost')}
            onClick={() => setFilterStatus('PAID')}
          >
            Fully Paid
          </button>
        </div>

        <DataTable
          columns={columns}
          rows={sales}
          loading={loading}
          emptyText="No sales found for the selected filter."
        />
      </div>

      {/* Record Sale Modal */}
      {isRecordModalOpen && (
        <Modal title="Record Sale to Vendor" onClose={() => setIsRecordModalOpen(false)}>
          <form onSubmit={handleRecordSubmit}>
            <div className="form-grid" style={{ marginBottom: '18px' }}>
              <label className="full">
                Select Street Vendor / Retailer
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.vendor_id} value={v.vendor_id}>
                      {v.vendor_name} ({v.location}) - {v.phone_number}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <h4 style={{ marginBottom: '8px' }}>Fruits & Packaging Selection</h4>
            <p className="muted" style={{ fontSize: '0.82rem', marginBottom: '12px' }}>
              Select packaging size (Small, Medium, Large) and quantity. The system validates available stock automatically.
            </p>

            <LineItemEditor
              items={items}
              setItems={setItems}
              fruits={fruits}
              stock={stock}
              priceKey="unit_price"
              priceLabel={`Unit Price (${currency})`}
              showStock={true}
            />

            <h4 style={{ marginTop: '20px', marginBottom: '12px' }}>Payment Details</h4>
            <div className="form-grid">
              <label>
                Payment Method
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money (M-Pesa / EcoCash)</option>
                </select>
              </label>

              <label>
                Amount Paid Now ({currency})
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalAmount}
                  placeholder={`Leave blank for full ${formatMoney(totalAmount)}`}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
              </label>

              <label className="full">
                Payment Reference / Note (Optional)
                <input
                  type="text"
                  placeholder="e.g. M-Pesa transaction ID or cash receipt"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              </label>
            </div>

            <div className="card" style={{ marginTop: '14px', background: 'var(--bg)' }}>
              <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sale Grand Total:</span>
                <strong>{formatMoney(totalAmount)}</strong>
              </p>
              <p style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                <span>Amount Paid:</span>
                <span>{formatMoney(amountPaid !== '' ? Number(amountPaid) : totalAmount)}</span>
              </p>
              <p style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span>Remaining Balance (Credit):</span>
                <strong
                  style={{
                    color:
                      totalAmount - (amountPaid !== '' ? Number(amountPaid) : totalAmount) > 0
                        ? 'var(--red)'
                        : 'var(--green-700)',
                  }}
                >
                  {formatMoney(Math.max(0, totalAmount - (amountPaid !== '' ? Number(amountPaid) : totalAmount)))}
                </strong>
              </p>
            </div>

            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsRecordModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Processing Sale...' : 'Complete & Record Sale'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Sale Details Modal */}
      {viewingSale && (
        <Modal
          title={`Sale #${viewingSale.sale_id} Details`}
          onClose={() => setViewingSale(null)}
        >
          <div style={{ marginBottom: '16px' }}>
            <p>
              <strong>Vendor:</strong> {viewingSale.vendor_name} ({viewingSale.location})
            </p>
            <p>
              <strong>Phone:</strong> {viewingSale.phone_number}
            </p>
            <p>
              <strong>Date:</strong> {viewingSale.sale_date?.slice(0, 10)}
            </p>
            <p>
              <strong>Status:</strong> <StatusBadge status={viewingSale.payment_status} />
            </p>
            <p>
              <strong>Total Amount:</strong> {formatMoney(viewingSale.total_amount)} |{' '}
              <strong>Paid:</strong> {formatMoney(viewingSale.amount_paid)} |{' '}
              <strong>Balance:</strong> {formatMoney(viewingSale.outstanding_balance)}
            </p>
          </div>

          <h4 style={{ marginBottom: '8px' }}>Sold Fruit Items</h4>
          <table style={{ width: '100%', marginBottom: '16px' }}>
            <thead>
              <tr>
                <th>Fruit</th>
                <th>Packaging Size</th>
                <th>Quantity (Boxes)</th>
                <th>Unit Selling Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(viewingSale.items || []).map((it, idx) => (
                <tr key={idx}>
                  <td>{it.fruit_name}</td>
                  <td>{it.packaging_size}</td>
                  <td>{it.quantity}</td>
                  <td>{formatMoney(it.unit_price)}</td>
                  <td>{formatMoney(it.line_total || it.quantity * it.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {viewingSale.payments && viewingSale.payments.length > 0 && (
            <>
              <h4 style={{ marginBottom: '8px' }}>Payment Transactions</h4>
              <table style={{ width: '100%', marginBottom: '16px' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingSale.payments.map((p, idx) => (
                    <tr key={idx}>
                      <td>{p.payment_date ? p.payment_date.slice(0, 10) : '-'}</td>
                      <td>{p.payment_method}</td>
                      <td>{p.reference || '-'}</td>
                      <td>{formatMoney(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setPrintingSale(viewingSale);
                setViewingSale(null);
              }}
            >
              🖨️ Open Printable Receipt
            </button>
            <button className="btn btn-secondary" onClick={() => setViewingSale(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Printable Receipt Modal */}
      {printingSale && (
        <ReceiptModal sale={printingSale} onClose={() => setPrintingSale(null)} />
      )}
    </section>
  );
}

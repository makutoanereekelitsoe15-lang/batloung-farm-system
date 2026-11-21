// pages/Payments.jsx — Vendor Payment & Credit Management
import { useState, useEffect } from 'react';
import { paymentService } from '../services/payments';
import { saleService } from '../services/sales';
import { useCurrency } from '../context/CurrencyContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function Payments() {
  const [outstandingVendors, setOutstandingVendors] = useState([]);
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [unpaidSales, setUnpaidSales] = useState([]);
  const [activeTab, setActiveTab] = useState('outstanding'); // 'outstanding' | 'history'
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const { currency, formatMoney } = useCurrency();

  // Record payment modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [outRes, historyRes, unpaidRes, partialRes] = await Promise.all([
        paymentService.getOutstanding(),
        paymentService.getAll(),
        saleService.getAll('UNPAID'),
        saleService.getAll('PARTIALLY_PAID'),
      ]);
      setOutstandingVendors(outRes.data || []);
      setPaymentsHistory(historyRes.data || []);
      const allUnpaid = [...(unpaidRes.data || []), ...(partialRes.data || [])];
      setUnpaidSales(allUnpaid);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to load payments data.' });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenRecord(saleId = '') {
    setSelectedSaleId(saleId || (unpaidSales.length > 0 ? unpaidSales[0].sale_id : ''));
    if (saleId) {
      const found = unpaidSales.find((s) => s.sale_id === Number(saleId));
      if (found) {
        setPaymentAmount(found.outstanding_balance);
      }
    } else if (unpaidSales.length > 0) {
      setPaymentAmount(unpaidSales[0].outstanding_balance);
    }
    setPaymentMethod('CASH');
    setReference('');
    setNotes('');
    setIsModalOpen(true);
  }

  function handleSaleSelectionChange(saleId) {
    setSelectedSaleId(saleId);
    const found = unpaidSales.find((s) => s.sale_id === Number(saleId));
    if (found) {
      setPaymentAmount(found.outstanding_balance);
    }
  }

  async function handleSubmitPayment(e) {
    e.preventDefault();
    if (!selectedSaleId) {
      setAlert({ type: 'error', message: 'Please select a sale to pay against.' });
      return;
    }
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setAlert({ type: 'error', message: 'Please enter a valid payment amount.' });
      return;
    }

    setSaving(true);
    setAlert({ type: '', message: '' });

    try {
      await paymentService.create({
        sale_id: Number(selectedSaleId),
        amount: amount,
        payment_method: paymentMethod,
        reference: reference,
        notes: notes,
      });
      setAlert({
        type: 'success',
        message: `Payment of ${formatMoney(amount)} recorded successfully. Sale balance updated.`,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Payment processing failed.' });
    } finally {
      setSaving(false);
    }
  }

  const totalOutstanding = outstandingVendors.reduce(
    (sum, v) => sum + (Number(v.outstanding_balance) || 0),
    0
  );

  const outstandingColumns = [
    { key: 'vendor_name', label: 'Vendor / Retailer' },
    { key: 'phone_number', label: 'Phone' },
    { key: 'location', label: 'Location' },
    { key: 'invoice_count', label: 'Open Invoices' },
    {
      key: 'total_billed',
      label: 'Total Billed',
      render: (v) => formatMoney(v.total_billed),
    },
    {
      key: 'total_paid',
      label: 'Total Paid',
      render: (v) => formatMoney(v.total_paid),
    },
    {
      key: 'outstanding_balance',
      label: 'Outstanding Credit (Owed)',
      render: (v) => (
        <strong style={{ color: 'var(--red)', fontSize: '0.98rem' }}>
          {formatMoney(v.outstanding_balance)}
        </strong>
      ),
    },
  ];

  const historyColumns = [
    { key: 'payment_id', label: 'Receipt #' },
    {
      key: 'payment_date',
      label: 'Date',
      render: (p) => (p.payment_date ? p.payment_date.slice(0, 10) : '-'),
    },
    { key: 'sale_id', label: 'For Sale #' },
    { key: 'vendor_name', label: 'Vendor' },
    { key: 'payment_method', label: 'Method' },
    {
      key: 'reference',
      label: 'Reference',
      render: (p) => p.reference || '-',
    },
    {
      key: 'amount',
      label: 'Amount Paid',
      render: (p) => <strong>{formatMoney(p.amount)}</strong>,
    },
    {
      key: 'payment_status',
      label: 'Sale Status Now',
      render: (p) => <StatusBadge status={p.payment_status} />,
    },
  ];

  const selectedSaleObj = unpaidSales.find((s) => s.sale_id === Number(selectedSaleId));

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Vendor Payments & Outstanding Credit</h2>
          <p className="muted">
            Track vendor credit, record cash and mobile money payments, and calculate outstanding balances
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => handleOpenRecord()}
          disabled={unpaidSales.length === 0}
        >
          + Record New Payment
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
          icon="💳"
          label="Total Outstanding Credit"
          value={formatMoney(totalOutstanding)}
          hint="Sum of all unpaid vendor balances"
          tone={totalOutstanding > 0 ? 'amber' : 'green'}
        />
        <StatCard
          icon="🧺"
          label="Vendors with Credit"
          value={outstandingVendors.length}
          hint="Currently owe payment"
          tone="neutral"
        />
        <StatCard
          icon="🧾"
          label="Pending Invoices"
          value={unpaidSales.length}
          hint="Unpaid or partially paid sales"
          tone="neutral"
        />
      </div>

      <div className="card">
        <div className="toolbar" style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className={'btn btn-small ' + (activeTab === 'outstanding' ? 'btn-primary' : 'btn-ghost')}
            onClick={() => setActiveTab('outstanding')}
          >
            Outstanding Balances by Vendor
          </button>
          <button
            type="button"
            className={'btn btn-small ' + (activeTab === 'history' ? 'btn-primary' : 'btn-ghost')}
            onClick={() => setActiveTab('history')}
          >
            Payment Transaction History
          </button>
        </div>

        {activeTab === 'outstanding' ? (
          <DataTable
            columns={outstandingColumns}
            rows={outstandingVendors}
            loading={loading}
            emptyText="Great news! There are no outstanding vendor balances right now."
          />
        ) : (
          <DataTable
            columns={historyColumns}
            rows={paymentsHistory}
            loading={loading}
            emptyText="No payments have been recorded yet."
          />
        )}
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <Modal title="Record Vendor Payment" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmitPayment} className="form-grid">
            <label className="full">
              Select Outstanding Sale Invoice
              <select
                value={selectedSaleId}
                onChange={(e) => handleSaleSelectionChange(e.target.value)}
                required
              >
                <option value="">-- Choose Sale Invoice --</option>
                {unpaidSales.map((s) => (
                  <option key={s.sale_id} value={s.sale_id}>
                    Sale #{s.sale_id} — {s.vendor_name} (Total: {formatMoney(s.total_amount)}, Balance: {formatMoney(s.outstanding_balance)})
                  </option>
                ))}
              </select>
            </label>

            {selectedSaleObj && (
              <div className="full card" style={{ background: 'var(--bg)', padding: '12px' }}>
                <p>
                  <strong>Vendor:</strong> {selectedSaleObj.vendor_name}
                </p>
                <p>
                  <strong>Invoice Total:</strong> {formatMoney(selectedSaleObj.total_amount)}
                </p>
                <p>
                  <strong>Remaining Balance:</strong>{' '}
                  <span style={{ color: 'var(--red)', fontWeight: 700 }}>
                    {formatMoney(selectedSaleObj.outstanding_balance)}
                  </span>
                </p>
              </div>
            )}

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
              Amount to Pay ({currency})
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedSaleObj ? Number(selectedSaleObj.outstanding_balance) : undefined}
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </label>

            <label className="full">
              Transaction Reference
              <input
                type="text"
                placeholder="e.g. MP-847294 or Cash Receipt #"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </label>

            <label className="full">
              Notes / Comment
              <textarea
                rows={2}
                placeholder="Optional notes regarding this payment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            <div className="full form-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

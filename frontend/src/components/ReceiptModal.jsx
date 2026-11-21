// components/ReceiptModal.jsx — Printable Official Vendor Receipt & Invoice
import { useCurrency } from '../context/CurrencyContext';

export default function ReceiptModal({ sale, onClose }) {
  const { formatMoney } = useCurrency();
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = sale.payment_status === 'PAID';
  const isPartial = sale.payment_status === 'PARTIALLY_PAID';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal printable-receipt-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        <div className="modal-header no-print">
          <h3>Vendor Sales Invoice & Receipt</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-primary btn-small" onClick={handlePrint}>
              🖨️ Print / Save PDF
            </button>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
              &times;
            </button>
          </div>
        </div>

        <div className="modal-body printable-receipt">
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid var(--green-700)',
              paddingBottom: '14px',
              marginBottom: '16px',
            }}
          >
            <div>
              <h2 style={{ color: 'var(--green-900)', fontSize: '1.4rem', margin: 0 }}>
                BATLOUNG FARM
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '2px 0 0' }}>
                Fresh Produce Distribution Management
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
                Maseru Central Market & District Depot, Lesotho
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: isPaid
                    ? '2px solid var(--green-700)'
                    : isPartial
                    ? '2px solid var(--amber)'
                    : '2px solid var(--red)',
                  color: isPaid
                    ? 'var(--green-700)'
                    : isPartial
                    ? 'var(--amber)'
                    : 'var(--red)',
                  textTransform: 'uppercase',
                }}
              >
                {isPaid ? 'PAID IN FULL' : isPartial ? 'PARTIALLY PAID' : 'UNPAID / CREDIT'}
              </span>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: '6px 0 0' }}>
                Invoice #: BF-SALE-{sale.sale_id}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
                Date: {sale.sale_date ? sale.sale_date.slice(0, 10) : new Date().toISOString().slice(0, 10)}
              </p>
            </div>
          </div>

          {/* Vendor Details */}
          <div
            style={{
              background: 'var(--bg)',
              padding: '12px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.86rem',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <strong>Billed To (Vendor):</strong>
                <p style={{ margin: '2px 0 0' }}>{sale.vendor_name}</p>
                <p style={{ margin: 0, color: 'var(--muted)' }}>Location: {sale.location || 'Maseru'}</p>
              </div>
              <div>
                <strong>Contact Phone:</strong>
                <p style={{ margin: '2px 0 0' }}>{sale.phone_number}</p>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  Payment Method: {sale.payment_method || 'CASH'}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', marginBottom: '16px', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                <th style={{ padding: '8px' }}>Fruit Variety</th>
                <th style={{ padding: '8px' }}>Size</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Quantity (Boxes)</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(sale.items || []).map((it, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>
                    <strong>{it.fruit_name}</strong>
                  </td>
                  <td style={{ padding: '8px' }}>{it.packaging_size}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{it.quantity}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{formatMoney(it.unit_price)}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                    {formatMoney(it.line_total || it.quantity * it.unit_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <div style={{ width: '240px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span className="muted">Grand Total:</span>
                <strong>{formatMoney(sale.total_amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span className="muted">Amount Paid:</span>
                <span style={{ color: 'var(--green-700)', fontWeight: 600 }}>
                  {formatMoney(sale.amount_paid)}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderTop: '2px solid var(--line)',
                  marginTop: '4px',
                }}
              >
                <span>Balance Due (Credit):</span>
                <strong
                  style={{
                    color: Number(sale.outstanding_balance) > 0 ? 'var(--red)' : 'var(--green-700)',
                    fontSize: '1rem',
                  }}
                >
                  {formatMoney(sale.outstanding_balance)}
                </strong>
              </div>
            </div>
          </div>

          {/* Footer & Disclaimer */}
          <div
            style={{
              borderTop: '1px dashed var(--line)',
              paddingTop: '12px',
              textAlign: 'center',
              fontSize: '0.76rem',
              color: 'var(--muted)',
            }}
          >
            <p>Thank you for doing business with Batloung Farm Distribution!</p>
            <p>Maseru, Kingdom of Lesotho &bull; Fresh Produce Direct from Farms</p>
          </div>

          {/* Modal Actions (Hidden in Print) */}
          <div className="form-actions no-print" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={handlePrint}>
              🖨️ Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

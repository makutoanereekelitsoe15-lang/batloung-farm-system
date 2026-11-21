// components/LineItemEditor.jsx
// Line item editor used by both Purchases and Sales pages.
// Displays live available stock per packaging size to prevent overselling.
import { useCurrency } from '../context/CurrencyContext';

export default function LineItemEditor({
  items,
  setItems,
  fruits = [],
  stock = [],
  priceKey = 'unit_cost',
  priceLabel = 'Unit Cost',
  showStock = false,
}) {
  const { formatMoney } = useCurrency();

  const emptyLine = {
    fruit_id: '',
    packaging_size: 'MEDIUM',
    quantity: 1,
    [priceKey]: '',
  };

  const update = (index, field, value) => {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    setItems(next);
  };

  const addLine = () => setItems([...items, { ...emptyLine }]);
  const removeLine = (index) => setItems(items.filter((_, i) => i !== index));

  const availableFor = (fruitId, size) => {
    if (!showStock) return null;
    const row = (stock || []).find(
      (s) => Number(s.fruit_id) === Number(fruitId) && s.packaging_size === size
    );
    return row ? row.available_quantity : 0;
  };

  // Get full size breakdown for a selected fruit
  const getAllSizesFor = (fruitId) => {
    if (!showStock || !fruitId) return null;
    const fruitRows = (stock || []).filter((s) => Number(s.fruit_id) === Number(fruitId));
    const small = fruitRows.find((s) => s.packaging_size === 'SMALL')?.available_quantity ?? 0;
    const medium = fruitRows.find((s) => s.packaging_size === 'MEDIUM')?.available_quantity ?? 0;
    const large = fruitRows.find((s) => s.packaging_size === 'LARGE')?.available_quantity ?? 0;
    return { small, medium, large };
  };

  const total = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item[priceKey]) || 0;
    return sum + qty * price;
  }, 0);

  return (
    <div>
      <div className="line-editor">
        <div className="line-head">
          <span>Fruit</span>
          <span>Packaging</span>
          <span>Quantity</span>
          <span>{priceLabel}</span>
          <span>Line Total</span>
          <span></span>
        </div>

        {items.map((item, index) => {
          const available = availableFor(item.fruit_id, item.packaging_size);
          const tooMany = available !== null && Number(item.quantity) > available;
          const allSizes = getAllSizesFor(item.fruit_id);

          return (
            <div key={index} style={{ marginBottom: '10px' }}>
              <div className="line-row">
                <select
                  value={item.fruit_id}
                  onChange={(event) => update(index, 'fruit_id', event.target.value)}
                  required
                >
                  <option value="">Select fruit...</option>
                  {fruits.map((fruit) => (
                    <option key={fruit.fruit_id} value={fruit.fruit_id}>
                      {fruit.fruit_name}
                    </option>
                  ))}
                </select>

                <select
                  value={item.packaging_size}
                  onChange={(event) => update(index, 'packaging_size', event.target.value)}
                >
                  <option value="SMALL">SMALL</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LARGE">LARGE</option>
                </select>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(event) => update(index, 'quantity', event.target.value)}
                  required
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={item[priceKey]}
                  onChange={(event) => update(index, priceKey, event.target.value)}
                  required
                />

                <span className="line-total">
                  {formatMoney((Number(item.quantity) || 0) * (Number(item[priceKey]) || 0))}
                </span>

                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() => removeLine(index)}
                  disabled={items.length === 1}
                >
                  Remove
                </button>
              </div>

              {/* Real-time Available Stock Feedback */}
              {showStock && item.fruit_id && allSizes && (
                <div
                  style={{
                    background: tooMany ? '#fdecea' : '#eef8f2',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    marginTop: '5px',
                    fontSize: '0.78rem',
                    border: tooMany ? '1px solid var(--red)' : '1px solid #c9ebd7',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <span>
                      <strong>📦 Available Stock:</strong> Small: <strong>{allSizes.small}</strong> | Medium: <strong>{allSizes.medium}</strong> | Large: <strong>{allSizes.large}</strong> boxes
                    </span>
                    <span style={{ fontWeight: 600, color: tooMany ? 'var(--red)' : 'var(--green-700)' }}>
                      Selected ({item.packaging_size}): {available} boxes available
                    </span>
                  </div>

                  {tooMany && (
                    <p style={{ color: 'var(--red)', fontWeight: 700, marginTop: '3px' }}>
                      ⚠️ Insufficient Stock: You requested {item.quantity} boxes, but only {available} are available. System will reject this sale to protect inventory.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="line-footer">
        <button type="button" className="btn btn-secondary btn-small" onClick={addLine}>
          + Add another fruit
        </button>
        <p className="grand-total">
          Total: <strong>{formatMoney(total)}</strong>
        </p>
      </div>
    </div>
  );
}

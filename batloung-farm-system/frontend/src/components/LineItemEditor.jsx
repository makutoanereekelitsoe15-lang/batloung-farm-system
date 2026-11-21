// components/LineItemEditor.jsx
// Line item editor used by both Purchases and Sales pages.
// It allows adding multiple fruit items and calculates running totals.
export default function LineItemEditor({
  items,
  setItems,
  fruits = [],
  stock = [],
  priceKey = 'unit_cost',
  priceLabel = 'Unit Cost (R)',
  showStock = false,
}) {
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
          return (
            <div key={index}>
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
                  R {((Number(item.quantity) || 0) * (Number(item[priceKey]) || 0)).toFixed(2)}
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

              {showStock && item.fruit_id && (
                <p className={tooMany ? 'line-stock danger' : 'line-stock'}>
                  Available: <strong>{available}</strong> box(es)
                  {tooMany ? ' — not enough stock for this quantity' : ''}
                </p>
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
          Total: <strong>R {total.toFixed(2)}</strong>
        </p>
      </div>
    </div>
  );
}

// components/StatusBadge.jsx
// Coloured pill for PAID / PARTIALLY_PAID / UNPAID / LOW / OK.
export default function StatusBadge({ status }) {
  const text = String(status || '').toUpperCase();
  let tone = 'neutral';
  if (text === 'PAID' || text === 'OK' || text === 'ACTIVE') tone = 'green';
  else if (text === 'PARTIALLY_PAID' || text === 'LOW') tone = 'amber';
  else if (text === 'UNPAID' || text === 'OUT_OF_STOCK' || text === 'INACTIVE') tone = 'red';

  const label = text.replace(/_/g, ' ').toLowerCase();
  return <span className={'badge badge-' + tone}>{label}</span>;
}

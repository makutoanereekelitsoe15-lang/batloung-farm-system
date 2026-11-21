// components/StatCard.jsx
// One overview card on the dashboard.
export default function StatCard({ label, value, hint, tone = 'green', icon }) {
  return (
    <div className={'stat-card tone-' + tone}>
      <div className="stat-icon">{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {hint && <p className="stat-hint">{hint}</p>}
      </div>
    </div>
  );
}

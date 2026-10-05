export default function StatCard({ label, value, hint, warn }) {
  return (
    <div className="panel stat">
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>
      {hint && <p className={`stat__hint${warn ? ' stat__hint--warn' : ''}`}>{hint}</p>}
    </div>
  );
}

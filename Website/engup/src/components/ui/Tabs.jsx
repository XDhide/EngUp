/** items: [{ key, label, count? }] */
export default function Tabs({ items, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((t) => (
        <button key={t.key} type="button" role="tab" aria-selected={value === t.key}
          className={`tab${value === t.key ? ' active' : ''}`} onClick={() => onChange(t.key)}>
          {t.label}{t.count !== undefined && <span className="tab__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

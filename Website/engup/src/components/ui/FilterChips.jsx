/** options: [{ value, label }] – "Tất cả" có value rỗng. */
export default function FilterChips({ label, options, value, onChange }) {
  return (
    <div className="chips">
      {label && <span className="chips__label">{label}</span>}
      {options.map((o) => (
        <button key={o.value} type="button" className={`chip${value === o.value ? ' active' : ''}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

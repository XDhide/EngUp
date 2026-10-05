import { useId } from 'react';

function Field({ label, required, hint, children, htmlFor }) {
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}{required && <span className="field__req"> *</span>}
        </label>
      )}
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

export function TextField({ label, required, hint, ...rest }) {
  const id = useId();
  return <Field label={label} required={required} hint={hint} htmlFor={id}><input id={id} className="input" required={required} {...rest} /></Field>;
}

export function TextAreaField({ label, required, hint, rows = 3, ...rest }) {
  const id = useId();
  return <Field label={label} required={required} hint={hint} htmlFor={id}><textarea id={id} className="textarea" rows={rows} required={required} {...rest} /></Field>;
}

/** options: [{ value, label }]; placeholder hiển thị chữ "Chọn..." khi rỗng (không dùng icon). */
export function SelectField({ label, required, hint, options, placeholder = 'Chọn...', ...rest }) {
  const id = useId();
  return (
    <Field label={label} required={required} hint={hint} htmlFor={id}>
      <select id={id} className="select" required={required} {...rest}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export function FileField({ label, hint, ...rest }) {
  const id = useId();
  return <Field label={label} hint={hint} htmlFor={id}><input id={id} type="file" className="input" {...rest} /></Field>;
}

export const SearchInput = (props) => <input type="search" className="input toolbar__search" {...props} />;

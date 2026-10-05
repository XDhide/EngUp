import { useState } from 'react';

/** [values, bind, setValues]: bind('field') -> onChange handler cho input/select/textarea. */
export function useFormState(initial) {
  const [values, setValues] = useState(initial);
  const bind = (key) => (e) => setValues((s) => ({ ...s, [key]: e.target.value }));
  return [values, bind, setValues];
}

/** '' -> null, còn lại trim. */
export const clean = (v) => {
  const s = typeof v === 'string' ? v.trim() : v;
  return s === '' || s === undefined ? null : s;
};

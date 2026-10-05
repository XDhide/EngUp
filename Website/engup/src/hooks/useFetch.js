import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../services/apiClient';

/** Gọi API khi deps đổi; trả về { data, loading, error, reload }. Bỏ qua kết quả của request cũ. */
export function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const ticket = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    const id = ++ticket.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await fetcherRef.current();
      if (id === ticket.current) setState({ data, loading: false, error: '' });
    } catch (e) {
      if (id === ticket.current) setState({ data: null, loading: false, error: errorMessage(e) });
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, deps);

  return { ...state, reload: run };
}

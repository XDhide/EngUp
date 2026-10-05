import { pageList } from '../../utils/format';

/** Phân trang dạng chữ: [Trang trước] 1 2 3 ... 12 [Trang sau] */
export default function Pagination({ page, totalPages, summary, onChange }) {
  return (
    <div className="pager">
      <span>{summary}</span>
      {totalPages > 1 && (
        <nav className="pager__nav" aria-label="Phân trang">
          <button type="button" className="pager__btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>[Trang trước]</button>
          {pageList(page, totalPages).map((p, i) =>
            p === '...' ? <span key={`d${i}`}>...</span> : (
              <button key={p} type="button" className={`pager__btn${p === page ? ' active' : ''}`} onClick={() => onChange(p)}>{p}</button>
            ))}
          <button type="button" className="pager__btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>[Trang sau]</button>
        </nav>
      )}
    </div>
  );
}

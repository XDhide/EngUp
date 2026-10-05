/**
 * columns: [{ key, header, render?(row), align? }]
 * Hiển thị trạng thái đang tải / lỗi / rỗng bằng chữ.
 */
export default function DataTable({ columns, rows, rowKey = 'id', selectedId, onRowClick, loading, emptyText = 'Không có dữ liệu.' }) {
  if (loading && !rows?.length) return <div className="state">Đang tải dữ liệu...</div>;
  if (!rows?.length) return <div className="state">{emptyText}</div>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} className={c.align === 'right' ? 'right' : ''}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const id = typeof rowKey === 'function' ? rowKey(row, i) : row[rowKey];
            const cls = [onRowClick && 'clickable', selectedId !== undefined && selectedId === id && 'selected'].filter(Boolean).join(' ');
            return (
              <tr key={id} className={cls} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {columns.map((c) => (
                  <td key={c.key} className={c.align === 'right' ? 'right' : ''}>{c.render ? c.render(row) : row[c.key]}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

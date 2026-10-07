import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CEFR_OPTIONS } from '../../constants';
import { errorMessage, learningPathService, listeningService, readingService, vocabularyService } from '../../services';
import { Badge, Button, ErrorBanner, SearchInput, SelectField, TextAreaField, TextField } from '../ui';

const TYPES = [
  { key: 'word', label: 'Từ vựng' },
  { key: 'reading', label: 'Bài đọc' },
  { key: 'listening', label: 'Bài nghe' },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.key, t.label]));

const normalize = (type, x) => {
  if (type === 'word') return { item_type: 'word', item_id: x.id, title: x.word, subtitle: x.meaning };
  if (type === 'reading') return { item_type: 'reading', item_id: x.id, title: x.title, subtitle: x.topic };
  return { item_type: 'listening', item_id: x.id, title: x.title, subtitle: x.topic };
};

export default function PathModal({ path, onClose, onSaved }) {
  const editing = !!path;
  const [title, setTitle] = useState(path?.title ?? '');
  const [description, setDescription] = useState(path?.description ?? '');
  const [level, setLevel] = useState(path?.level ?? '');
  const [items, setItems] = useState(() => (path?.items || []).filter((i) => !i.missing).map((i) => ({ item_type: i.item_type, item_id: i.item_id, title: i.title, subtitle: i.subtitle })));
  const [tab, setTab] = useState('word');
  const [source, setSource] = useState([]);
  const [topics, setTopics] = useState([]);
  const [topicId, setTopicId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    vocabularyService.topics().then((r) => setTopics(r.topics || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const load = async () => {
      if (tab === 'word') {
        const r = await vocabularyService.list({ limit: 200, ...(topicId ? { topic_id: topicId } : {}) });
        return (r.words || []).map((w) => normalize('word', w));
      }
      if (tab === 'reading') return ((await readingService.list({})).articles || []).map((a) => normalize('reading', a));
      return ((await listeningService.list({})).lessons || []).map((l) => normalize('listening', l));
    };
    load().then((list) => alive && setSource(list)).catch((e) => alive && setError(errorMessage(e))).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [tab, topicId]);

  const selectedKeys = useMemo(() => new Set(items.map((i) => `${i.item_type}:${i.item_id}`)), [items]);
  const visible = source.filter((s) => !search.trim() || `${s.title} ${s.subtitle || ''}`.toLowerCase().includes(search.trim().toLowerCase()));

  const add = (list) => setItems((cur) => {
    const keys = new Set(cur.map((i) => `${i.item_type}:${i.item_id}`));
    return [...cur, ...list.filter((s) => !keys.has(`${s.item_type}:${s.item_id}`))];
  });
  const remove = (idx) => setItems((cur) => cur.filter((_, i) => i !== idx));
  const move = (idx, dir) => setItems((cur) => {
    const next = [...cur];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return cur;
    [next[idx], next[j]] = [next[j], next[idx]];
    return next;
  });

  const submit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    if (!title.trim()) return setError('Vui lòng nhập tên lộ trình.');
    if (!items.length) return setError('Lộ trình cần ít nhất 1 từ vựng hoặc bài học.');
    const payload = { title: title.trim(), description: description.trim() || null, level: level || null, items: items.map((i) => ({ item_type: i.item_type, item_id: i.item_id })) };
    setBusy(true);
    try {
      const saved = editing ? await learningPathService.update(path.id, payload) : await learningPathService.create(payload);
      onSaved?.(saved);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return createPortal(
    <div className="backdrop" onClick={busy ? undefined : onClose}>
      <form className="modal modal--wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ maxHeight: '94vh', overflowY: 'auto', width: 'min(960px, 96vw)' }}>
        <div className="panel__head"><h2 className="panel__title">{editing ? 'Sửa lộ trình học' : 'Tạo lộ trình học'}</h2></div>
        <div className="panel__body">
          <ErrorBanner message={error} />
          {error && <div style={{ height: 12 }} />}
          <div className="form-row">
            <TextField label="Tên lộ trình" required maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} />
            <SelectField label="Cấp độ" options={CEFR_OPTIONS} value={level} onChange={(e) => setLevel(e.target.value)} />
          </div>
          <TextAreaField label="Mô tả" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div>
              <p className="cell-strong" style={{ marginBottom: 8 }}>Nội dung lộ trình ({items.length})</p>
              <div style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid var(--outline-variant, #d9e3f6)', borderRadius: 8, padding: 8 }}>
                {!items.length && <p className="cell-sub">Chưa có mục nào. Chọn từ danh sách bên phải.</p>}
                {items.map((i, idx) => (
                  <div key={`${i.item_type}:${i.item_id}`} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
                    <span className="cell-sub" style={{ width: 24 }}>{idx + 1}</span>
                    <Badge tone="off">{TYPE_LABEL[i.item_type]}</Badge>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.title}</span>
                    <button type="button" className="link-btn" onClick={() => move(idx, -1)} aria-label="Lên">↑</button>
                    <button type="button" className="link-btn" onClick={() => move(idx, 1)} aria-label="Xuống">↓</button>
                    <button type="button" className="link-btn" onClick={() => remove(idx)} aria-label="Xóa">✕</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {TYPES.map((t) => <Button key={t.key} variant={tab === t.key ? 'primary' : undefined} onClick={() => { setTab(t.key); setSearch(''); }}>{t.label}</Button>)}
              </div>
              {tab === 'word' && (
                <div style={{ marginBottom: 8 }}>
                  <SelectField label="Lọc theo chủ đề" placeholder="Tất cả chủ đề" options={topics.map((t) => ({ value: String(t.id), label: t.name }))} value={topicId} onChange={(e) => setTopicId(e.target.value)} />
                </div>
              )}
              <SearchInput placeholder="Tìm trong danh sách..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <div style={{ margin: '8px 0' }}>
                <Button onClick={() => add(visible)} disabled={!visible.length}>Thêm tất cả ({visible.length})</Button>
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--outline-variant, #d9e3f6)', borderRadius: 8, padding: 8 }}>
                {loading && <p className="cell-sub">Đang tải...</p>}
                {!loading && !visible.length && <p className="cell-sub">Không có mục phù hợp.</p>}
                {visible.map((s) => {
                  const picked = selectedKeys.has(`${s.item_type}:${s.item_id}`);
                  return (
                    <div key={s.item_id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
                      <span style={{ flex: 1, minWidth: 0 }}><span className="cell-strong">{s.title}</span>{s.subtitle ? <span className="cell-sub"> — {s.subtitle}</span> : null}</span>
                      <button type="button" className="link-btn" disabled={picked} onClick={() => add([s])}>{picked ? 'Đã thêm' : 'Thêm'}</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="panel__foot">
          <Button onClick={onClose} disabled={busy}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu lộ trình'}</Button>
        </div>
      </form>
    </div>,
    document.body
  );
}

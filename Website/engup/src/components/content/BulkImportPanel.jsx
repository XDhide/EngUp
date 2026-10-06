import { useMemo, useState } from 'react';
import { CEFR_OPTIONS } from '../../constants';
import { vocabularyService, errorMessage } from '../../services';
import { Button, ErrorBanner, LinkButton, Panel, SelectField, TextAreaField } from '../ui';
import TopicPicker from './TopicPicker';

const DELIMS = ['\t', '|', ';', ','];

/** Mỗi dòng: từ | nghĩa | phiên âm | câu ví dụ  (chỉ cần cột đầu nếu bật AI). Phân tách bằng Tab, |, ; hoặc , */
export function parseWordLines(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const d = DELIMS.find((x) => line.includes(x));
      const cols = (d ? line.split(d) : [line]).map((c) => c.trim().replace(/^"|"$/g, ''));
      return { word: cols[0], meaning: cols[1] || '', phonetic: cols[2] || '', example_sentence: cols[3] || '' };
    })
    .filter((r) => r.word && !/^(word|từ|từ vựng)$/i.test(r.word)); // bỏ dòng tiêu đề
}

export default function BulkImportPanel({ topics, onTopicsChanged, onDone, onCancel }) {
  const [text, setText] = useState('');
  const [topicId, setTopicId] = useState('');
  const [level, setLevel] = useState('');
  const [ai, setAi] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const rows = useMemo(() => parseWordLines(text), [text]);
  const missingMeaning = rows.filter((r) => !r.meaning).length;

  const loadFile = async (e) => {
    const f = e.target.files?.[0];
    if (f) setText(await f.text());
    e.target.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setResult(null);
    try {
      const data = await vocabularyService.bulkCreate({
        items: rows, topic_id: topicId ? Number(topicId) : null, difficulty: level || undefined, ai_enrich: ai,
      });
      setResult(data);
      if (data.created > 0) onDone?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <Panel title="Nhập từ vựng hàng loạt" subtitle="Dán danh sách hoặc tải file .csv/.txt — không cần gõ từng từ"
        action={<LinkButton tone="muted" onClick={onCancel}>Đóng</LinkButton>}
        footer={<><Button onClick={onCancel} disabled={busy}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={busy || rows.length === 0}>{busy ? 'Đang xử lý...' : `Nhập ${rows.length} từ`}</Button></>}>
        <ErrorBanner message={error} />
        <TextAreaField label="Danh sách từ" rows={9} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={'adaptability\nresilient | kiên cường\nbenefit | lợi ích | /ˈben.ɪ.fɪt/ | This job has many benefits.'}
          hint="Mỗi dòng một từ. Có thể thêm: từ | nghĩa | phiên âm | câu ví dụ (ngăn cách bằng |, Tab, ; hoặc ,)." />
        <input type="file" accept=".csv,.txt,.tsv" onChange={loadFile} style={{ margin: '8px 0 16px' }} />
        <TopicPicker label="Chủ đề chung" topics={topics} value={topicId} onChange={setTopicId} onTopicsChanged={onTopicsChanged} />
        <div className="form-row">
          <SelectField label="Cấp độ mặc định" options={CEFR_OPTIONS} value={level} onChange={(e) => setLevel(e.target.value)} />
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
          <input type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} />
          AI tự điền nghĩa, phiên âm, câu ví dụ, cấp độ cho phần còn thiếu
        </label>
        {ai && missingMeaning > 0 && <p className="field__hint">{missingMeaning} từ chưa có nghĩa sẽ được AI điền (cần cấu hình WRITING_LLM_API_KEY ở Backend).</p>}
        {!ai && missingMeaning > 0 && <p className="field__hint">{missingMeaning} từ chưa có nghĩa sẽ bị bỏ qua.</p>}
        {result && (
          <div style={{ marginTop: 16 }}>
            <p><strong>Đã thêm {result.created} từ.</strong> Bỏ qua {result.skipped.length}, lỗi {result.failed.length}.</p>
            {result.ai_error && <p className="field__hint">AI lỗi: {result.ai_error}</p>}
            {[...result.skipped, ...result.failed].slice(0, 10).map((r, i) => <p key={i} className="field__hint">• {r.word}: {r.reason}</p>)}
          </div>
        )}
      </Panel>
    </form>
  );
}

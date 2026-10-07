import { apiRequest } from './apiClient';
import { API_NOTES, API_NOTE } from './api';

export type NoteRefType = 'none' | 'word' | 'reading' | 'listening' | 'test';
export type NoteColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'gray';

export const NOTE_COLORS: { key: NoteColor; bg: string; label: string }[] = [
  { key: 'yellow', bg: '#fff4c2', label: 'Vàng' },
  { key: 'green', bg: '#d9f7e3', label: 'Xanh lá' },
  { key: 'blue', bg: '#dbeafe', label: 'Xanh dương' },
  { key: 'pink', bg: '#fde2ea', label: 'Hồng' },
  { key: 'purple', bg: '#ece3fb', label: 'Tím' },
  { key: 'gray', bg: '#eceff4', label: 'Xám' },
];

export const REF_LABELS: Record<NoteRefType, string> = {
  none: 'Ghi chú tự do',
  word: 'Từ vựng',
  reading: 'Bài đọc',
  listening: 'Bài nghe',
  test: 'Đề thi',
};

export interface UserNote {
  id: number;
  title: string | null;
  content: string;
  color: NoteColor | null;
  is_pinned: boolean;
  ref_type: NoteRefType;
  ref_id: number | null;
  ref_label: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  title?: string | null;
  content: string;
  color?: NoteColor | null;
  is_pinned?: boolean;
  ref_type?: NoteRefType;
  ref_id?: number | null;
  ref_label?: string | null;
}

export const notesService = {
  async list(params: { q?: string; ref_type?: NoteRefType | 'all' } = {}): Promise<{ notes: UserNote[]; total: number }> {
    const query = new URLSearchParams();
    if (params.q?.trim()) query.append('q', params.q.trim());
    if (params.ref_type && params.ref_type !== 'all') query.append('ref_type', params.ref_type);
    query.append('limit', '100');
    const res = await apiRequest<{ notes: UserNote[]; total: number }>(`${API_NOTES}?${query.toString()}`);
    return { notes: res.notes ?? [], total: res.total ?? 0 };
  },
  create: (data: NoteInput) => apiRequest<UserNote>(API_NOTES, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<NoteInput>) =>
    apiRequest<UserNote>(API_NOTE(id), { method: 'PUT', body: JSON.stringify(data) }),
  async remove(id: number): Promise<void> {
    await apiRequest(API_NOTE(id), { method: 'DELETE' });
  },
};

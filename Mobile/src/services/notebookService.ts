import { apiRequest } from './apiClient';
import { VocabularyWord } from './vocabularyService';

// Khớp enum của backend (personal_notebook_entries.source_type).
export type NotebookSourceType = 'vocabulary' | 'reading' | 'listening' | 'manual';

export interface NotebookEntry {
  id: number;
  user_id: number;
  word_id: number;
  source_type: NotebookSourceType;
  source_id?: number | null;
  note?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at?: string;
  word?: VocabularyWord;
}

export const notebookService = {
  // Backend chưa hỗ trợ tìm kiếm chữ; màn Sổ tay tự lọc phía client.
  async getEntries(params: {
    source_type?: string;
    tag?: string;
  } = {}): Promise<{ entries: NotebookEntry[] }> {
    const query = new URLSearchParams();
    if (params.source_type && params.source_type !== 'all') {
      query.append('source_type', params.source_type);
    }
    if (params.tag) query.append('tag', params.tag);
    const qs = query.toString();
    const res = await apiRequest<{ entries: NotebookEntry[] }>(`/notebook${qs ? `?${qs}` : ''}`);
    return { entries: res.entries ?? [] };
  },

  async addEntry(data: {
    word_id: number;
    source_type: NotebookSourceType;
    source_id?: number;
    note?: string;
    tags?: string[];
  }): Promise<NotebookEntry> {
    return apiRequest<NotebookEntry>('/notebook', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEntry(id: number, data: { note?: string; tags?: string[] }): Promise<NotebookEntry> {
    return apiRequest<NotebookEntry>(`/notebook/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteEntry(id: number): Promise<void> {
    await apiRequest(`/notebook/${id}`, { method: 'DELETE' });
  },
};

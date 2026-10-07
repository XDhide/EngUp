import { apiRequest } from './apiClient';
import {
  API_WRITING_PROMPTS,
  API_WRITING_SUBMISSIONS,
  API_WRITING_SUBMISSION_DETAIL,
} from './api';

export type WritingType = 'free' | 'ielts' | 'toeic';

export interface WritingPrompt {
  id: number;
  title: string;
  prompt_text: string;
  difficulty: string | null;
  /** Được gắn phía client theo bộ lọc đã dùng khi tải danh sách */
  type?: WritingType;
}

// Theo prompt chấm điểm của backend: hai danh sách là mảng chuỗi, điểm (ai_score) tối đa 100.
export interface AiFeedback {
  overall_comment?: string;
  grammar_errors?: string[];
  vocabulary_suggestions?: string[];
}

export interface WritingSubmission {
  id: number;
  prompt_id: number;
  ai_score: number | null;
  created_at: string;
}

export interface WritingSubmissionDetail extends WritingSubmission {
  content: string;
  ai_feedback: AiFeedback | null;
}

export interface WritingSubmitResult {
  id: number;
  ai_feedback: AiFeedback | null;
  ai_score: number | null;
}

export const WRITING_TYPES: Array<{ key: WritingType; label: string }> = [
  { key: 'free', label: 'Tự do' },
  { key: 'ielts', label: 'IELTS' },
  { key: 'toeic', label: 'TOEIC' },
];

const toScore = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const writingService = {
  // DTO danh sách không kèm `type`, nên tải theo từng loại rồi gắn nhãn.
  async getAllPrompts(): Promise<WritingPrompt[]> {
    const groups = await Promise.all(
      WRITING_TYPES.map(async (t) => {
        const r = await apiRequest<{ prompts: WritingPrompt[] }>(`${API_WRITING_PROMPTS}?type=${t.key}`);
        return (r.prompts ?? []).map((p) => ({ ...p, type: t.key }));
      })
    );
    return groups.flat();
  },

  async submit(promptId: number, content: string): Promise<WritingSubmitResult> {
    const r = await apiRequest<WritingSubmitResult>(API_WRITING_SUBMISSIONS, {
      method: 'POST',
      body: JSON.stringify({ prompt_id: promptId, content }),
    });
    return { ...r, ai_score: toScore(r.ai_score) };
  },

  async getSubmissions(): Promise<WritingSubmission[]> {
    const r = await apiRequest<{ submissions: WritingSubmission[] }>(API_WRITING_SUBMISSIONS);
    return (r.submissions ?? []).map((s) => ({ ...s, ai_score: toScore(s.ai_score) }));
  },

  async getSubmission(id: number): Promise<WritingSubmissionDetail> {
    const r = await apiRequest<WritingSubmissionDetail>(API_WRITING_SUBMISSION_DETAIL(id));
    return { ...r, ai_score: toScore(r.ai_score) };
  },
};

export const countWords = (text: string): number =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

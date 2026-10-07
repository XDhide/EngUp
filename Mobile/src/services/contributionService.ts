import { apiRequest } from './apiClient';
import {
  API_CONTRIB_MINE,
  API_CONTRIB_READING,
  API_CONTRIB_VOCABULARY,
  API_CONTRIB_TEST_QUESTION,
  API_CONTRIB_ITEM,
} from './api';

export type ContributionType = 'reading_article' | 'vocabulary_word' | 'test_question';
export type ContributionStatus = 'pending' | 'approved' | 'rejected';

export const CONTRIB_TYPE_LABELS: Record<ContributionType, string> = {
  reading_article: 'Bài đọc',
  vocabulary_word: 'Từ vựng',
  test_question: 'Câu hỏi đề thi',
};

export const CONTRIB_STATUS_LABELS: Record<ContributionStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
};

export interface Contribution {
  id: number;
  content_type: ContributionType;
  content_id: number;
  title: string | null;
  status: ContributionStatus;
  reject_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface ReadingQuestionInput {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
}

export const contributionService = {
  async listMine(): Promise<{ items: Contribution[]; max_pending: number }> {
    const r = await apiRequest<{ items: Contribution[]; max_pending: number }>(API_CONTRIB_MINE);
    return { items: r.items ?? [], max_pending: r.max_pending ?? 20 };
  },

  submitVocabulary: (data: {
    word: string;
    meaning: string;
    phonetic?: string;
    example_sentence?: string;
    difficulty?: string;
    topic_id?: number | null;
  }) => apiRequest<Contribution>(API_CONTRIB_VOCABULARY, { method: 'POST', body: JSON.stringify(data) }),

  submitReading: (data: {
    title: string;
    content: string;
    difficulty?: string;
    topic?: string;
    questions?: ReadingQuestionInput[];
  }) => apiRequest<Contribution>(API_CONTRIB_READING, { method: 'POST', body: JSON.stringify(data) }),

  submitTestQuestion: (data: {
    test_set_id: number;
    question_type: 'multiple_choice' | 'fill_blank';
    question_text: string;
    options?: string[];
    correct_answer: string;
    passage_text?: string;
  }) => apiRequest<Contribution>(API_CONTRIB_TEST_QUESTION, { method: 'POST', body: JSON.stringify(data) }),

  async withdraw(id: number): Promise<void> {
    await apiRequest(API_CONTRIB_ITEM(id), { method: 'DELETE' });
  },
};

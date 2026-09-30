import { apiRequest } from './apiClient';

export interface ReadingQuestion {
  id: number;
  question_text: string;
  /** Dạng gốc của backend: ["A. Big Ben", "B. ..."] */
  options: string[];
}

export interface ReadingArticleSummary {
  id: number;
  title: string;
  difficulty: string | null;
  topic: string | null;
  is_ai_generated?: boolean;
}

export interface ReadingArticle extends ReadingArticleSummary {
  content: string;
  questions: ReadingQuestion[];
}

export interface ReadingReviewItem {
  question_id: number;
  correct_answer: string;
  is_correct: boolean;
}

export interface ReadingSubmitResult {
  score: number;
  correct_count: number;
  total_count: number;
  review: ReadingReviewItem[];
}

export interface ParsedOption {
  /** Chữ cái đáp án gửi lên backend (A/B/C/D) */
  key: string;
  label: string;
}

/** Tách "A. Big Ben" -> { key: 'A', label: 'Big Ben' }; nếu không có tiền tố thì dùng thứ tự. */
export function parseOptions(options: unknown): ParsedOption[] {
  if (!Array.isArray(options)) return [];
  return options.map((raw, index) => {
    const text = String(raw);
    const match = text.match(/^\s*([A-Za-z])[.)]\s*(.*)$/s);
    if (match) return { key: match[1].toUpperCase(), label: match[2] };
    return { key: String.fromCharCode(65 + index), label: text };
  });
}

export const readingService = {
  async getArticles(): Promise<{ articles: ReadingArticleSummary[] }> {
    const res = await apiRequest<{ articles: ReadingArticleSummary[] }>('/reading/articles');
    return { articles: res.articles ?? [] };
  },

  async getArticleDetail(id: number): Promise<ReadingArticle> {
    const res = await apiRequest<ReadingArticle>(`/reading/articles/${id}`);
    return { ...res, questions: res.questions ?? [] };
  },

  async submitArticle(
    id: number,
    answers: Array<{ question_id: number; answer: string }>
  ): Promise<ReadingSubmitResult> {
    const res = await apiRequest<Partial<ReadingSubmitResult>>(`/reading/articles/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    return {
      score: Number(res.score ?? 0),
      correct_count: res.correct_count ?? 0,
      total_count: res.total_count ?? answers.length,
      review: res.review ?? [],
    };
  },
};

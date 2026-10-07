import { apiRequest } from './apiClient';
import {
  API_TESTS,
  API_TESTS_QUESTIONS,
  API_TESTS_START,
  API_TESTS_SUBMIT,
  API_TESTS_SUBMIT_WRITING,
  API_TESTS_ATTEMPTS,
  API_TESTS_ATTEMPT_RESULT,
} from './api';

export type ExamType = 'IELTS' | 'TOEIC';

export interface TestSetSummary {
  id: number;
  title: string;
  section: string;
  time_limit_minutes: number;
  exam_type: ExamType;
}

export type TestQuestionType = 'multiple_choice' | 'fill_blank' | 'essay' | 'speaking_prompt';

export interface TestQuestion {
  id: number;
  question_text: string;
  question_type: TestQuestionType;
  options: string[] | null;
  audio_url: string | null;
  passage_text: string | null;
  order_index: number;
}

export interface StartAttemptResult {
  attempt_id: number;
  started_at: string;
  time_limit_minutes: number;
}

export interface AttemptSummary {
  id: number;
  test_set_id: number;
  status: string;
  score: number | null;
  band_score: number | null;
  started_at: string;
  submitted_at: string | null;
}

export interface AnswerReview {
  question_id: number;
  your_answer: string | null;
  correct_answer: string | null;
  is_correct: boolean;
}

export interface AttemptResult {
  score: number | null;
  band_score: number | null;
  answers_review: AnswerReview[];
  feedback?: unknown;
}

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const isWritingTest = (questions: TestQuestion[]) =>
  questions.some((q) => q.question_type === 'essay' || q.question_type === 'speaking_prompt');

export const testService = {
  // DTO danh sách không kèm exam_type -> gọi theo từng loại rồi gắn nhãn.
  async getTestSets(): Promise<TestSetSummary[]> {
    const types: ExamType[] = ['IELTS', 'TOEIC'];
    const groups = await Promise.all(
      types.map(async (t) => {
        const r = await apiRequest<{ test_sets: Omit<TestSetSummary, 'exam_type'>[] }>(
          `${API_TESTS}?exam_type=${t}`
        );
        return (r.test_sets ?? []).map((s) => ({ ...s, exam_type: t }));
      })
    );
    return groups.flat();
  },

  async getQuestions(testSetId: number): Promise<TestQuestion[]> {
    const r = await apiRequest<{ questions: TestQuestion[] }>(API_TESTS_QUESTIONS(testSetId));
    return [...(r.questions ?? [])].sort((a, b) => a.order_index - b.order_index);
  },

  async start(testSetId: number): Promise<StartAttemptResult> {
    return apiRequest<StartAttemptResult>(API_TESTS_START(testSetId), { method: 'POST' });
  },

  async submit(
    testSetId: number,
    attemptId: number,
    answers: Array<{ question_id: number; answer: string }>
  ): Promise<{ score: number | null; band_score: number | null }> {
    const r = await apiRequest<{ score: unknown; band_score: unknown }>(API_TESTS_SUBMIT(testSetId), {
      method: 'POST',
      body: JSON.stringify({ attempt_id: attemptId, answers }),
    });
    return { score: toNum(r.score), band_score: toNum(r.band_score) };
  },

  async submitWriting(
    testSetId: number,
    attemptId: number,
    content: string
  ): Promise<{ band_score: number | null; feedback: unknown }> {
    const r = await apiRequest<{ band_score: unknown; feedback: unknown }>(
      API_TESTS_SUBMIT_WRITING(testSetId),
      { method: 'POST', body: JSON.stringify({ attempt_id: attemptId, content }) }
    );
    return { band_score: toNum(r.band_score), feedback: r.feedback };
  },

  async getAttempts(): Promise<AttemptSummary[]> {
    const r = await apiRequest<{ attempts: AttemptSummary[] }>(API_TESTS_ATTEMPTS);
    return (r.attempts ?? []).map((a) => ({
      ...a,
      score: toNum(a.score),
      band_score: toNum(a.band_score),
    }));
  },

  async getResult(attemptId: number): Promise<AttemptResult> {
    const r = await apiRequest<AttemptResult>(API_TESTS_ATTEMPT_RESULT(attemptId));
    return {
      ...r,
      score: toNum(r.score),
      band_score: toNum(r.band_score),
      answers_review: r.answers_review ?? [],
    };
  },
};


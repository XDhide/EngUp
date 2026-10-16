import { apiRequest } from './apiClient';
import {
  API_LISTENING_LESSONS,
  API_LISTENING_LESSON_DETAIL,
  API_LISTENING_DICTATION,
  API_RESULTS_LISTENING,
} from './api';

export interface ListeningLessonSummary {
  id: number;
  title: string;
  difficulty: string | null;
  topic: string | null;
  audio_url: string | null;
}

export interface ListeningLessonDetail {
  id: number;
  title: string;
  audio_url: string | null;
  /** Backend trả sẵn transcript; UI chỉ được hiện SAU khi người học nộp bài. */
  transcript: string;
}

export interface DictationResult {
  accuracy_percent: number;
  wrong_words: string[];
}

export interface ListeningHistoryItem {
  id: number;
  lesson_id: number;
  title: string | null;
  difficulty: string | null;
  accuracy_percent: number;
  wrong_count: number;
  submitted_at: string;
}

export const listeningService = {
  async getLessons(): Promise<{ lessons: ListeningLessonSummary[] }> {
    const r = await apiRequest<{ lessons: ListeningLessonSummary[] }>(API_LISTENING_LESSONS);
    return { lessons: r.lessons ?? [] };
  },

  async getLesson(id: number): Promise<ListeningLessonDetail> {
    return apiRequest<ListeningLessonDetail>(API_LISTENING_LESSON_DETAIL(id));
  },

  async submitDictation(id: number, userText: string): Promise<DictationResult> {
    const r = await apiRequest<DictationResult>(API_LISTENING_DICTATION(id), {
      method: 'POST',
      body: JSON.stringify({ user_text: userText }),
    });
    return { accuracy_percent: Number(r.accuracy_percent) || 0, wrong_words: r.wrong_words ?? [] };
  },

  /** Lịch sử các lần nghe chép của chính người dùng (mới nhất trước). */
  async getHistory(): Promise<ListeningHistoryItem[]> {
    const r = await apiRequest<{ attempts: ListeningHistoryItem[] }>(API_RESULTS_LISTENING);
    return (r.attempts ?? []).map((a) => ({ ...a, accuracy_percent: Number(a.accuracy_percent) || 0 }));
  },
};


// Bản sao logic so khớp của backend (theo vị trí từ) để tô đỏ từ sai trong transcript.
const normalizeWord = (w: string) =>
  w.toLowerCase().replace(/[.,!?;:"'“”‘’()\-]/g, '').trim();

export function diffAgainstTranscript(
  transcript: string,
  userText: string
): Array<{ word: string; correct: boolean }> {
  const expected = transcript.split(/\s+/).filter(Boolean);
  const typed = userText.split(/\s+/).filter(Boolean);
  return expected.map((word, i) => ({
    word,
    correct: i < typed.length && normalizeWord(typed[i]) === normalizeWord(word),
  }));
}

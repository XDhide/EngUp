import { apiRequest } from './apiClient';
import { API_STATS_OVERVIEW, API_STATS_PROGRESS } from './api';

export interface StatsOverview {
  total_words_learned: number;
  total_reviews: number;
  current_streak: number;
  longest_streak: number;
  /** null khi chưa làm bài đọc/nghe nào */
  reading_avg_score: number | null;
  listening_avg_accuracy: number | null;
}

export interface ProgressTimelineItem {
  date: string; // YYYY-MM-DD
  words_reviewed: number;
  minutes_studied: number;
}

export type StatsRange = '7d' | '30d' | 'all';

const num = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const statsService = {
  async getOverview(): Promise<StatsOverview> {
    const r = await apiRequest<Record<string, unknown>>(API_STATS_OVERVIEW);
    return {
      total_words_learned: num(r.total_words_learned) ?? 0,
      total_reviews: num(r.total_reviews) ?? 0,
      current_streak: num(r.current_streak) ?? 0,
      longest_streak: num(r.longest_streak) ?? 0,
      reading_avg_score: num(r.reading_avg_score),
      listening_avg_accuracy: num(r.listening_avg_accuracy),
    };
  },

  async getProgress(range: StatsRange = '7d'): Promise<{ timeline: ProgressTimelineItem[] }> {
    const r = await apiRequest<{ timeline: ProgressTimelineItem[] }>(`${API_STATS_PROGRESS}?range=${range}`);
    return {
      timeline: (r.timeline ?? []).map((t) => ({
        date: t.date,
        words_reviewed: Number(t.words_reviewed) || 0,
        // Backend trả phút dạng số thập phân; làm tròn 1 chữ số để hiển thị gọn.
        minutes_studied: Math.round((Number(t.minutes_studied) || 0) * 10) / 10,
      })),
    };
  },
};

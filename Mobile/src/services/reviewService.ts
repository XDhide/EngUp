import { apiRequest } from './apiClient';
import { VocabularyWord } from './vocabularyService';
import { API_REVIEW_TODAY, API_REVIEW_SUBMIT } from './api';

/** Thẻ ôn tập đã được chuẩn hoá cho UI (word là object đầy đủ). */
export interface UserVocabularyCard {
  id: number;
  word_id: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string | null;
  word: VocabularyWord;
}

export type ReviewResultType = 'again' | 'hard' | 'good' | 'easy';

export interface SubmitReviewResponse {
  next_review_at: string;
  interval_days: number;
}

interface RawReviewCard {
  card_id: number;
  word_id?: number;
  word: string | null;
  meaning: string | null;
  phonetic?: string | null;
  example_sentence?: string | null;
  audio_url?: string | null;
  difficulty?: string | null;
  interval_days?: number;
  repetitions?: number;
  next_review_at: string | null;
}

export const reviewService = {
  async getTodayReviews(): Promise<{ cards: UserVocabularyCard[]; count: number }> {
    const res = await apiRequest<{ cards: RawReviewCard[] }>(API_REVIEW_TODAY);
    const cards: UserVocabularyCard[] = (res.cards ?? [])
      .filter((c) => !!c.word)
      .map((c) => ({
        id: c.card_id,
        word_id: c.word_id ?? 0,
        interval_days: c.interval_days ?? 0,
        repetitions: c.repetitions ?? 0,
        next_review_at: c.next_review_at,
        word: {
          id: c.word_id ?? 0,
          topic_id: null,
          word: c.word as string,
          phonetic: c.phonetic ?? null,
          meaning: c.meaning ?? '',
          example_sentence: c.example_sentence ?? null,
          audio_url: c.audio_url ?? null,
          difficulty: c.difficulty ?? null,
        },
      }));
    return { cards, count: cards.length };
  },

  async submitReview(data: {
    card_id: number;
    result: ReviewResultType;
    response_time_ms?: number;
  }): Promise<SubmitReviewResponse> {
    return apiRequest<SubmitReviewResponse>(API_REVIEW_SUBMIT, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

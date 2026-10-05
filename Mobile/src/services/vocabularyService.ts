import { apiRequest } from './apiClient';
import {
  API_VOCABULARY_TOPICS,
  API_VOCABULARY_WORDS,
  API_VOCABULARY_NEW_WORDS,
  API_VOCABULARY_DAILY_LIMIT,
} from './api';

export interface VocabularyTopic {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  /** Được bổ sung phía client bằng GET /vocabulary/words?topic_id=&limit=1 */
  total_words?: number;
}

export interface VocabularyWord {
  id: number;
  topic_id: number | null;
  word: string;
  phonetic: string | null;
  meaning: string;
  example_sentence: string | null;
  audio_url: string | null;
  difficulty: string | null;
}

export interface NewWordsResponse {
  words: VocabularyWord[];
  daily_limit: number;
  learned_today: number;
}

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export const difficultyGroup = (d?: string | null): 'easy' | 'mid' | 'hard' | null => {
  switch (d?.toUpperCase()) {
    case 'A1':
    case 'A2':
      return 'easy';
    case 'B1':
    case 'B2':
      return 'mid';
    case 'C1':
    case 'C2':
      return 'hard';
    default:
      return null;
  }
};

export const difficultyLabel = (d?: string | null): string => {
  const g = difficultyGroup(d);
  return g === 'easy' ? 'Dễ' : g === 'hard' ? 'Khó' : g === 'mid' ? 'Vừa' : '';
};

export const vocabularyService = {
  async getTopics(): Promise<{ topics: VocabularyTopic[] }> {
    const res = await apiRequest<{ topics: VocabularyTopic[] }>(API_VOCABULARY_TOPICS);
    const topics = await Promise.all(
      res.topics.map(async (t) => {
        try {
          const w = await apiRequest<{ total: number }>(
            `${API_VOCABULARY_WORDS}?topic_id=${t.id}&limit=1`
          );
          return { ...t, total_words: w.total };
        } catch {
          return t;
        }
      })
    );
    return { topics };
  },

  async getWords(params: {
    topic_id?: number;
    difficulty?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ words: VocabularyWord[]; total: number }> {
    const query = new URLSearchParams();
    if (params.topic_id) query.append('topic_id', String(params.topic_id));
    if (params.difficulty) query.append('difficulty', params.difficulty);
    if (params.limit) query.append('limit', String(params.limit));
    if (params.offset) query.append('offset', String(params.offset));
    const qs = query.toString();
    return apiRequest<{ words: VocabularyWord[]; total: number }>(
      `${API_VOCABULARY_WORDS}${qs ? `?${qs}` : ''}`
    );
  },

  async getNewWords(limit?: number): Promise<NewWordsResponse> {
    const res = await apiRequest<Partial<NewWordsResponse>>(
      `${API_VOCABULARY_NEW_WORDS}${limit ? `?limit=${limit}` : ''}`
    );
    return {
      words: res.words ?? [],
      daily_limit: res.daily_limit ?? 10,
      learned_today: res.learned_today ?? 0,
    };
  },

  async updateDailyNewWordLimit(limit: number): Promise<{ daily_new_word_limit: number }> {
    return apiRequest<{ daily_new_word_limit: number }>(API_VOCABULARY_DAILY_LIMIT, {
      method: 'PUT',
      body: JSON.stringify({ limit }),
    });
  },
};


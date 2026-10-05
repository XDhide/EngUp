import { api } from './apiClient';
import {
  API_VOCABULARY_TOPICS, API_VOCABULARY_WORDS, API_VOCABULARY_WORD,
  API_READING_ARTICLES, API_READING_ARTICLE_DETAIL, API_ADMIN_READING_ARTICLES, API_ADMIN_READING_ARTICLE,
  API_LISTENING_LESSONS, API_LISTENING_LESSON_DETAIL, API_ADMIN_LISTENING_LESSONS,
  API_ADMIN_LISTENING_LESSON, API_ADMIN_LISTENING_LESSON_AUDIO,
} from '../constants/api';

export const vocabularyService = {
  topics: () => api.get(API_VOCABULARY_TOPICS),
  /** params: { topic_id, difficulty, limit, offset } -> { words[], total } */
  list: (params) => api.get(API_VOCABULARY_WORDS, params),
  create: (data) => api.post(API_VOCABULARY_WORDS, data),
  update: (id, data) => api.put(API_VOCABULARY_WORD(id), data),
  remove: (id) => api.del(API_VOCABULARY_WORD(id)),
};

export const readingService = {
  list: (params) => api.get(API_READING_ARTICLES, params), // -> { articles[] }
  detail: (id) => api.get(API_READING_ARTICLE_DETAIL(id)),
  create: (data) => api.post(API_ADMIN_READING_ARTICLES, data),
  update: (id, data) => api.put(API_ADMIN_READING_ARTICLE(id), data),
  remove: (id) => api.del(API_ADMIN_READING_ARTICLE(id)),
};

export const listeningService = {
  list: (params) => api.get(API_LISTENING_LESSONS, params), // -> { lessons[] }
  detail: (id) => api.get(API_LISTENING_LESSON_DETAIL(id)),
  create: (data) => api.post(API_ADMIN_LISTENING_LESSONS, data),
  update: (id, data) => api.put(API_ADMIN_LISTENING_LESSON(id), data),
  remove: (id) => api.del(API_ADMIN_LISTENING_LESSON(id)),
  uploadAudio: (id, file) => {
    const form = new FormData();
    form.append('audio', file);
    return api.post(API_ADMIN_LISTENING_LESSON_AUDIO(id), form);
  },
};

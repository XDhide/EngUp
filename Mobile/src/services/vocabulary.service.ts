import { apiFetch } from './api';

export type Topic = { id: string; name: string; wordCount: number; };
export type Word = { id: string; word: string; phonetic: string; pos: string; meaning: string; example: string; topicId: string; masteryLevel?: number; };
export type ReviewCard = { id: string; word: Word; dueAt: string; interval: number; };

export const getTopics = () => apiFetch<Topic[]>('/vocabulary/topics');
export const getWords = (params?: { topicId?: string; page?: number; limit?: number }) => apiFetch<{ words: Word[]; total: number }>('/vocabulary/words', { params });
export const createWord = (data: { word: string; phonetic: string; meaning: string; example: string; topicId: string }) => apiFetch<Word>('/vocabulary/words', { method: 'POST', body: JSON.stringify(data) });
export const updateWord = (id: string, data: Partial<Word>) => apiFetch<Word>(`/vocabulary/words/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteWord = (id: string) => apiFetch<{ success: boolean }>(`/vocabulary/words/${id}`, { method: 'DELETE' });
export const getNewWords = (params?: { limit?: number }) => apiFetch<Word[]>('/vocabulary/new-words', { params });
export const updateDailyNewWordLimit = (data: { limit: number }) => apiFetch<{ success: boolean }>('/vocabulary/daily-new-word-limit', { method: 'PUT', body: JSON.stringify(data) });
export const getTodayReviewCards = () => apiFetch<ReviewCard[]>('/review/today');
export const submitReview = (data: { cardId: string; rating: 'again' | 'hard' | 'good' | 'easy' }) => apiFetch<{ success: boolean }>('/review/submit', { method: 'POST', body: JSON.stringify(data) });

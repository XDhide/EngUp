import { apiFetch } from './api';

export type ListeningLesson = { id: string; title: string; description: string; difficulty: 'easy'|'medium'|'hard'; topic: string; durationSeconds: number; audioUrl: string; transcript?: string; wordCount: number; completedAt?: string; accuracy?: number; };
export type DictationResult = { accuracy: number; userText: string; correctText: string; errors: Array<{word: string; correction: string}>; srsRating: string; nextDueDate: string; };

export const getLessons = (params?: { page?: number; limit?: number; difficulty?: string; topic?: string }) => apiFetch<{ lessons: ListeningLesson[]; total: number }>('/listening/lessons', { params });
export const getLesson = (id: string) => apiFetch<ListeningLesson>(`/listening/lessons/${id}`);
export const submitDictation = (id: string, data: { transcription: string }) => apiFetch<DictationResult>(`/listening/lessons/${id}/dictation`, { method: 'POST', body: JSON.stringify(data) });

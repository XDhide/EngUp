import { apiFetch } from './api';

export type ReadingArticle = { id: string; title: string; content: string; difficulty: string; topic: string; questions: Question[]; vocabularies: VocabItem[]; };
export type Question = { id: string; text: string; options: {A:string;B:string;C:string;D:string}; correct?: string; explanation?: string; };
export type VocabItem = { word: string; phonetic: string; pos: string; meaning: string; example: string; };
export type SubmitReadingResult = { score: number; total: number; accuracy: number; bandScore: number; results: Array<{questionId:string; correct:boolean; userAnswer:string; correctAnswer:string; explanation:string}>; };

export const getArticles = (params?: { page?: number; limit?: number }) => apiFetch<{ articles: ReadingArticle[]; total: number }>('/reading/articles', { params });
export const getArticle = (id: string) => apiFetch<ReadingArticle>(`/reading/articles/${id}`);
export const getArticleDetail = getArticle;
export const submitReading = (id: string, data: { answers: Array<{ questionId: string; answer: string }> }) => apiFetch<SubmitReadingResult>(`/reading/articles/${id}/submit`, { method: 'POST', body: JSON.stringify(data) });
export const submitArticle = submitReading;
export const generateArticle = (data?: { topic?: string }) => apiFetch<ReadingArticle>('/reading/generate', { method: 'POST', body: JSON.stringify(data || {}) });


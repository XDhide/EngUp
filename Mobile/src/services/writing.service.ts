import { apiFetch } from './api';

export type WritingPrompt = { id: string; title: string; description: string; type: 'email'|'essay'|'paragraph'; difficulty: string; wordCount?: number; };
export type WritingSubmission = { id: string; promptId: string; content: string; score?: number; feedback?: { grammar: string[]; vocabulary: string[]; suggestions: string[] }; createdAt: string; };

export const getPrompts = (params?: { type?: string; page?: number; limit?: number }) => apiFetch<{ prompts: WritingPrompt[]; total: number }>('/writing/prompts', { params });
export const submitWriting = (data: { promptId: string; content: string }) => apiFetch<WritingSubmission>('/writing/submissions', { method: 'POST', body: JSON.stringify(data) });
export const createSubmission = submitWriting;
export const getSubmissions = (params?: { page?: number; limit?: number }) => apiFetch<{ submissions: WritingSubmission[]; total: number }>('/writing/submissions', { params });
export const getSubmission = (id: string) => apiFetch<WritingSubmission>(`/writing/submissions/${id}`);
export const getSubmissionDetail = getSubmission;


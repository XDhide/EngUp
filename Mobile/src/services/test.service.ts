import { apiFetch } from './api';

export type TestSet = { id: string; title: string; type: string; difficulty: string; questionCount: number; duration: number; };
export type TestQuestion = { id: string; passageTitle: string; passageText: string; questionText: string; options: {A:string;B:string;C:string;D:string}; points: number; };
export type TestAttempt = { id: string; testId: string; testTitle: string; bandScore?: number; score?: number; total: number; timeSpent: number; createdAt: string; };
export type TestResult = { attemptId: string; bandScore: number; correctCount: number; totalCount: number; accuracy: number; timeSpent: number; passageResults: Array<{title:string; correct:number; total:number; percentage:number}>; aiComment: string; };

export const getTests = (params?: { type?: string; page?: number; limit?: number }) => apiFetch<{ tests: TestSet[]; total: number }>('/tests', { params });
export const getTestSets = getTests;
export const getTestQuestions = (id: string) => apiFetch<TestQuestion[]>(`/tests/${id}/questions`);
export const getQuestions = getTestQuestions;
export const startTest = (id: string) => apiFetch<{ attemptId: string }>(`/tests/${id}/start`, { method: 'POST' });
export const startAttempt = startTest;
export const submitTest = (id: string, data: { answers: Array<{ questionId: string; answer: string }>; timeSpent: number }) => apiFetch<{ success: boolean }>(`/tests/${id}/submit`, { method: 'POST', body: JSON.stringify(data) });
export const submitAttempt = submitTest;
export const getAttempts = (params?: { page?: number; limit?: number }) => apiFetch<{ attempts: TestAttempt[]; total: number }>('/tests/attempts', { params });
export const getTestResult = (id: string) => apiFetch<TestResult>(`/tests/attempts/${id}/result`);
export const getAttemptResult = getTestResult;


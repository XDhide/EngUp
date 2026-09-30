import { apiFetch } from './api';

export type StatsOverview = { totalWords: number; masteredWords: number; studyStreak: number; weeklyGoalPercent: number; skillProgress: Array<{skill:string; percent:number; done:number; total:number}>; weeklyRanking?: string; weeklyComment?: string; };
export type DailyProgress = { date: string; day: string; minutes: number; percent: number; };
export type StatsProgress = { daily: DailyProgress[]; skillBreakdown: Array<{skill:string; percent:number; done:number; total:number}>; weeklyComment: string; ranking: string; };

export const getOverview = () => apiFetch<StatsOverview>('/statistics/overview');
export const getProgress = (params?: { period?: 'week' | 'month' | 'all' }) => apiFetch<StatsProgress>('/statistics/progress', { params });

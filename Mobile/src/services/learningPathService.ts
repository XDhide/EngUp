import { apiRequest } from './apiClient';
import { API_LEARNING_PATHS, API_LEARNING_PATH, API_LEARNING_PATH_ENROLL } from './api';

export type PathItemType = 'word' | 'reading' | 'listening';
export type PathStatus = 'approved' | 'pending' | 'rejected';

export const PATH_ITEM_LABELS: Record<PathItemType, string> = {
  word: 'Từ vựng',
  reading: 'Bài đọc',
  listening: 'Bài nghe',
};

export const PATH_STATUS_LABELS: Record<PathStatus, string> = {
  approved: 'Đã duyệt',
  pending: 'Chờ duyệt',
  rejected: 'Bị từ chối',
};

export interface PathGrade {
  key: string;
  label: string;
}

export interface PathProgress {
  total: number;
  done: number;
  completion_percent: number;
  mastery_percent: number;
  by_type: Record<PathItemType, { total: number; done: number }>;
  grade: PathGrade;
}

export interface LearningPathSummary {
  id: number;
  title: string;
  description: string | null;
  level: string | null;
  creator_name: string | null;
  is_official: boolean;
  is_approved: boolean;
  status: PathStatus;
  reject_reason: string | null;
  item_counts: { word: number; reading: number; listening: number; total: number };
  enrolled: boolean;
  progress: PathProgress | null;
}

export interface PathItem {
  item_type: PathItemType;
  item_id: number;
  order_index: number;
  missing: boolean;
  title: string | null;
  subtitle: string | null;
  done: boolean;
  mastery: number;
  best_score?: number | null;
  in_review?: boolean;
}

export interface LearningPathDetail extends LearningPathSummary {
  items: PathItem[];
  progress: PathProgress;
  completed_at: string | null;
  can_edit: boolean;
  can_delete: boolean;
}

export interface PathInput {
  title: string;
  description?: string | null;
  level?: string | null;
  items: { item_type: PathItemType; item_id: number }[];
}

export const learningPathService = {
  async list(scope: 'discover' | 'enrolled' | 'mine' = 'discover'): Promise<LearningPathSummary[]> {
    const r = await apiRequest<{ paths: LearningPathSummary[] }>(`${API_LEARNING_PATHS}?scope=${scope}`);
    return r.paths ?? [];
  },
  detail: (id: number) => apiRequest<LearningPathDetail>(API_LEARNING_PATH(id)),
  create: (data: PathInput) => apiRequest<LearningPathDetail>(API_LEARNING_PATHS, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<PathInput>) =>
    apiRequest<LearningPathDetail>(API_LEARNING_PATH(id), { method: 'PUT', body: JSON.stringify(data) }),
  async remove(id: number): Promise<void> {
    await apiRequest(API_LEARNING_PATH(id), { method: 'DELETE' });
  },
  enroll: (id: number) => apiRequest<LearningPathDetail>(API_LEARNING_PATH_ENROLL(id), { method: 'POST', body: JSON.stringify({}) }),
  async leave(id: number): Promise<void> {
    await apiRequest(API_LEARNING_PATH_ENROLL(id), { method: 'DELETE' });
  },
};

import { api } from './apiClient';
import { API_ADMIN_PLACEMENT_QUESTIONS, API_ADMIN_PLACEMENT_QUESTION, API_ADMIN_PLACEMENT_STATS } from '../constants/api';

export const placementService = {
  list: () => api.get(API_ADMIN_PLACEMENT_QUESTIONS),
  create: (data) => api.post(API_ADMIN_PLACEMENT_QUESTIONS, data),
  update: (id, data) => api.put(API_ADMIN_PLACEMENT_QUESTION(id), data),
  remove: (id) => api.del(API_ADMIN_PLACEMENT_QUESTION(id)),
  stats: () => api.get(API_ADMIN_PLACEMENT_STATS),
};

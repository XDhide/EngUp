import { api } from './apiClient';
import { API_LEARNING_PATHS, API_LEARNING_PATH, API_ADMIN_LEARNING_PATHS } from '../constants/api';

export const learningPathService = {
  list: (params) => api.get(API_ADMIN_LEARNING_PATHS, params),
  detail: (id) => api.get(API_LEARNING_PATH(id)),
  create: (data) => api.post(API_LEARNING_PATHS, data),
  update: (id, data) => api.put(API_LEARNING_PATH(id), data),
  remove: (id) => api.del(API_LEARNING_PATH(id)),
};

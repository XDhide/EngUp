import { api } from './apiClient';
import { API_ADMIN_LOGS_ERRORS, API_ADMIN_LOGS_AUDIT } from '../constants/api';

export const logsService = {
  /** params: { service: 'backend'|'ml-service', from, to } -> { logs: [{ service, level, message, created_at }] } */
  errors: (params) => api.get(API_ADMIN_LOGS_ERRORS, params),
  /** params: { actor_id, action } -> { logs: [{ actor_id, action, target_type, target_id, created_at }] } */
  audit: (params) => api.get(API_ADMIN_LOGS_AUDIT, params),
};

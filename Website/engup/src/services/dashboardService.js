import { api } from './apiClient';
import { API_ADMIN_DASHBOARD_OVERVIEW } from '../constants/api';

export const dashboardService = {
  /** -> { total_users, daily_active_users, completion_rate, recent_errors[] } */
  getOverview: () => api.get(API_ADMIN_DASHBOARD_OVERVIEW),
};

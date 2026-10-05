import { api } from './apiClient';
import { API_ADMIN_USERS, API_ADMIN_USER_STATUS } from '../constants/api';

export const usersService = {
  /** params: { search, status: 'active'|'inactive', page } -> { users[], total, page } (20 người/trang) */
  list: (params) => api.get(API_ADMIN_USERS, params),
  setStatus: (id, isActive) => api.put(API_ADMIN_USER_STATUS(id), { is_active: isActive }),
};
export const USERS_PAGE_SIZE = 20;

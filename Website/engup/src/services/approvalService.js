import { api } from './apiClient';
import {
  API_ADMIN_APPROVAL_PENDING, API_ADMIN_APPROVAL_DETAIL, API_ADMIN_APPROVAL_APPROVE, API_ADMIN_APPROVAL_REJECT,
} from '../constants/api';

export const approvalService = {
  pending: (params) => api.get(API_ADMIN_APPROVAL_PENDING, params),
  detail: (id) => api.get(API_ADMIN_APPROVAL_DETAIL(id)),
  approve: (id) => api.put(API_ADMIN_APPROVAL_APPROVE(id)),
  reject: (id, rejectReason) => api.put(API_ADMIN_APPROVAL_REJECT(id), { reject_reason: rejectReason }),
};

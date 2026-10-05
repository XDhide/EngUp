import { api } from './apiClient';
import {
  API_ADMIN_APPROVAL_PENDING, API_ADMIN_APPROVAL_APPROVE, API_ADMIN_APPROVAL_REJECT,
} from '../constants/api';

export const approvalService = {
  /** params: { type: 'reading_article'|'test_question' } -> { items: [{ id, content_type, content_id, created_at }] } */
  pending: (params) => api.get(API_ADMIN_APPROVAL_PENDING, params),
  approve: (id) => api.put(API_ADMIN_APPROVAL_APPROVE(id)),
  reject: (id, rejectReason) => api.put(API_ADMIN_APPROVAL_REJECT(id), { reject_reason: rejectReason }),
};

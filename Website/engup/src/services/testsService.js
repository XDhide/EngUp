import { api } from './apiClient';
import {
  API_TESTS, API_TESTS_QUESTIONS,
  API_ADMIN_TEST_SETS, API_ADMIN_TEST_SET,
  API_ADMIN_TEST_QUESTIONS, API_ADMIN_TEST_QUESTION, API_ADMIN_TEST_ATTEMPTS, API_ADMIN_TEST_SET_QUESTIONS,
} from '../constants/api';
import { EXAM_TYPES } from '../constants';

export const testsService = {
  /** API danh sách đề không trả exam_type nên gọi theo từng loại rồi gắn nhãn lại. */
  async listAll() {
    const results = await Promise.all(EXAM_TYPES.map((t) => api.get(API_TESTS, { exam_type: t })));
    return results.flatMap((r, i) => (r.test_sets || []).map((s) => ({ ...s, exam_type: EXAM_TYPES[i] })));
  },
  questions: (testSetId) => api.get(API_ADMIN_TEST_SET_QUESTIONS(testSetId)),
  studentQuestions: (testSetId) => api.get(API_TESTS_QUESTIONS(testSetId)),
  createSet: (data) => api.post(API_ADMIN_TEST_SETS, data),
  updateSet: (id, data) => api.put(API_ADMIN_TEST_SET(id), data),
  removeSet: (id) => api.del(API_ADMIN_TEST_SET(id)),
  createQuestion: (data) => api.post(API_ADMIN_TEST_QUESTIONS, data),
  updateQuestion: (id, data) => api.put(API_ADMIN_TEST_QUESTION(id), data),
  removeQuestion: (id) => api.del(API_ADMIN_TEST_QUESTION(id)),
  /** -> { attempts: [{ user_id, score, band_score, status }], completion_rate } */
  attempts: (testSetId) => api.get(API_ADMIN_TEST_ATTEMPTS, { test_set_id: testSetId }),
};

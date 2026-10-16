import { api } from './apiClient';
import {
  API_ADMIN_WRITING_PROMPTS, API_ADMIN_WRITING_PROMPT,
  API_ADMIN_RESULTS_TESTS, API_ADMIN_RESULTS_READING, API_ADMIN_RESULTS_LISTENING, API_ADMIN_RESULTS_WRITING,
} from '../constants/api';

/** Đề bài viết (Writing): -> { prompts: [{ id, title, prompt_text, type: free|ielts|toeic, difficulty }] } */
export const writingService = {
  list: () => api.get(API_ADMIN_WRITING_PROMPTS),
  create: (data) => api.post(API_ADMIN_WRITING_PROMPTS, data),
  update: (id, data) => api.put(API_ADMIN_WRITING_PROMPT(id), data),
  remove: (id) => api.del(API_ADMIN_WRITING_PROMPT(id)),
};

/** Điểm của học viên. Mỗi hàm -> { attempts: [...] } (kèm user_name, user_email, title, ...). */
export const resultsService = {
  tests: (params) => api.get(API_ADMIN_RESULTS_TESTS, params),
  reading: (params) => api.get(API_ADMIN_RESULTS_READING, params),
  listening: (params) => api.get(API_ADMIN_RESULTS_LISTENING, params),
  writing: (params) => api.get(API_ADMIN_RESULTS_WRITING, params),
};

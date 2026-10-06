/**
 * api.js – Tập trung TOÀN BỘ đường dẫn API endpoint của Website quản trị.
 * Các service KHÔNG gọi chuỗi đường dẫn trực tiếp mà import hằng số từ file này
 * (cùng quy ước với Mobile/src/services/api.ts).
 *
 * Quy ước:
 *  - Đường dẫn tĩnh (không tham số): chuỗi bình thường.
 *  - Đường dẫn động (có :id, ...): function trả về string.
 * Base URL (VITE_API_URL, ví dụ http://localhost:5000/api) được nối ở services/apiClient.js.
 */

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const API_ADMIN_AUTH_LOGIN = '/admin/auth/login';
export const API_AUTH_REFRESH = '/auth/refresh';
export const API_AUTH_LOGOUT = '/auth/logout';

// ─── ADMIN: TỔNG QUAN ────────────────────────────────────────────────────────
export const API_ADMIN_DASHBOARD_OVERVIEW = '/admin/dashboard/overview';

// ─── ADMIN: NGƯỜI DÙNG ───────────────────────────────────────────────────────
export const API_ADMIN_USERS = '/admin/users';
export const API_ADMIN_USER_DETAIL = (id) => `/admin/users/${id}`;
export const API_ADMIN_USER_STATUS = (id) => `/admin/users/${id}/status`;
export const API_ADMIN_USER_PROGRESS = (id) => `/admin/users/${id}/progress`;

// ─── ADMIN: HỌC LIỆU – TỪ VỰNG ───────────────────────────────────────────────
export const API_VOCABULARY_TOPICS = '/vocabulary/topics';
export const API_VOCABULARY_TOPIC = (id) => `/vocabulary/topics/${id}`;
export const API_VOCABULARY_WORDS = '/vocabulary/words';
export const API_VOCABULARY_WORD = (id) => `/vocabulary/words/${id}`;
export const API_VOCABULARY_WORDS_BULK = '/vocabulary/words/bulk';

// ─── ADMIN: HỌC LIỆU – BÀI ĐỌC ───────────────────────────────────────────────
export const API_READING_ARTICLES = '/reading/articles';
export const API_READING_ARTICLE_DETAIL = (id) => `/reading/articles/${id}`;
export const API_ADMIN_READING_ARTICLES = '/admin/reading/articles';
export const API_ADMIN_READING_ARTICLE = (id) => `/admin/reading/articles/${id}`;

// ─── ADMIN: HỌC LIỆU – BÀI NGHE ──────────────────────────────────────────────
export const API_LISTENING_LESSONS = '/listening/lessons';
export const API_LISTENING_LESSON_DETAIL = (id) => `/listening/lessons/${id}`;
export const API_ADMIN_LISTENING_LESSONS = '/admin/listening/lessons';
export const API_ADMIN_LISTENING_LESSON = (id) => `/admin/listening/lessons/${id}`;
export const API_ADMIN_LISTENING_LESSON_AUDIO = (id) => `/admin/listening/lessons/${id}/audio`;

// ─── ADMIN: DUYỆT NỘI DUNG ───────────────────────────────────────────────────
export const API_ADMIN_APPROVAL_PENDING = '/admin/content/pending';
export const API_ADMIN_APPROVAL_APPROVE = (id) => `/admin/content/${id}/approve`;
export const API_ADMIN_APPROVAL_REJECT = (id) => `/admin/content/${id}/reject`;

// ─── ADMIN: ĐỀ THI ───────────────────────────────────────────────────────────
export const API_TESTS = '/tests'; // danh sách đề (lọc ?exam_type=IELTS|TOEIC)
export const API_TESTS_QUESTIONS = (testSetId) => `/tests/${testSetId}/questions`;
export const API_ADMIN_TEST_SETS = '/admin/tests/test-sets';
export const API_ADMIN_TEST_SET = (id) => `/admin/tests/test-sets/${id}`;
export const API_ADMIN_TEST_QUESTIONS = '/admin/tests/questions';
export const API_ADMIN_TEST_QUESTION = (id) => `/admin/tests/questions/${id}`;
export const API_ADMIN_TEST_ATTEMPTS = '/admin/tests/attempts'; // ?test_set_id=

// ─── ADMIN: NHẬT KÝ ──────────────────────────────────────────────────────────
export const API_ADMIN_LOGS_ERRORS = '/admin/logs/errors';
export const API_ADMIN_LOGS_AUDIT = '/admin/logs/audit';

// ─── ADMIN: THÔNG BÁO & GÓI CƯỚC (Backend đã có, chưa có màn hình trong Stitch) ─
export const API_ADMIN_NOTIFICATION_TEMPLATES = '/admin/notifications/templates';
export const API_ADMIN_NOTIFICATION_TEMPLATE = (id) => `/admin/notifications/templates/${id}`;
export const API_ADMIN_NOTIFICATION_HISTORY = '/admin/notifications/sent-history';
export const API_ADMIN_SUBSCRIPTIONS = '/admin/subscriptions';
export const API_ADMIN_SUBSCRIPTION_PLANS = '/admin/subscriptions/plans';
export const API_ADMIN_SUBSCRIPTION_PLAN = (id) => `/admin/subscriptions/plans/${id}`;

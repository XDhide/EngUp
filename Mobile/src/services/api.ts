/**
 * api.ts – Tập trung toàn bộ đường dẫn API endpoint.
 * Các service KHÔNG gọi chuỗi đường dẫn trực tiếp mà import hằng số từ file này.
 *
 * Quy ước:
 *  - Đường dẫn tĩnh (không tham số): chuỗi bình thường.
 *  - Đường dẫn động (có :id, ...): function trả về string.
 */

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const API_AUTH_REGISTER                = '/auth/register';
export const API_AUTH_LOGIN                   = '/auth/login';
export const API_AUTH_LOGOUT                  = '/auth/logout';
export const API_AUTH_REFRESH                 = '/auth/refresh';
export const API_AUTH_ME                      = '/auth/me';
export const API_AUTH_PLACEMENT_QUESTIONS     = '/auth/placement-test/questions';
export const API_AUTH_PLACEMENT_SUBMIT        = '/auth/placement-test/submit';

// ─── VOCABULARY ──────────────────────────────────────────────────────────────
export const API_VOCABULARY_TOPICS            = '/vocabulary/topics';
export const API_VOCABULARY_WORDS             = '/vocabulary/words';
export const API_VOCABULARY_NEW_WORDS         = '/vocabulary/new-words';
export const API_VOCABULARY_DAILY_LIMIT       = '/vocabulary/daily-new-word-limit';

// ─── REVIEW (Flashcard / SRS) ─────────────────────────────────────────────────
export const API_REVIEW_TODAY                 = '/review/today';
export const API_REVIEW_SUBMIT                = '/review/submit';

// ─── NOTEBOOK ────────────────────────────────────────────────────────────────
export const API_NOTEBOOK                     = '/notebook';
export const API_NOTEBOOK_ENTRY = (id: number) => `/notebook/${id}`;

// ─── READING ─────────────────────────────────────────────────────────────────
export const API_READING_ARTICLES             = '/reading/articles';
export const API_READING_ARTICLE_DETAIL = (id: number) => `/reading/articles/${id}`;
export const API_READING_ARTICLE_SUBMIT = (id: number) => `/reading/articles/${id}/submit`;

// ─── LISTENING ───────────────────────────────────────────────────────────────
export const API_LISTENING_LESSONS            = '/listening/lessons';
export const API_LISTENING_LESSON_DETAIL = (id: number) => `/listening/lessons/${id}`;
export const API_LISTENING_DICTATION = (id: number) => `/listening/lessons/${id}/dictation`;

// ─── WRITING ─────────────────────────────────────────────────────────────────
export const API_WRITING_PROMPTS              = '/writing/prompts';
export const API_WRITING_SUBMISSIONS          = '/writing/submissions';
export const API_WRITING_SUBMISSION_DETAIL = (id: number) => `/writing/submissions/${id}`;

// ─── TESTS (IELTS / TOEIC) ───────────────────────────────────────────────────
export const API_TESTS                        = '/tests';
export const API_TESTS_QUESTIONS   = (testSetId: number) => `/tests/${testSetId}/questions`;
export const API_TESTS_START       = (testSetId: number) => `/tests/${testSetId}/start`;
export const API_TESTS_SUBMIT      = (testSetId: number) => `/tests/${testSetId}/submit`;
export const API_TESTS_SUBMIT_WRITING = (testSetId: number) => `/tests/${testSetId}/submit-writing`;
export const API_TESTS_ATTEMPTS               = '/tests/attempts';
export const API_TESTS_ATTEMPT_RESULT = (attemptId: number) => `/tests/attempts/${attemptId}/result`;

// ─── STATISTICS ──────────────────────────────────────────────────────────────
export const API_STATS_OVERVIEW               = '/stats/overview';
export const API_STATS_PROGRESS               = '/stats/progress';

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const API_NOTIFICATIONS                = '/notifications';
export const API_NOTIFICATIONS_SETTINGS       = '/notifications/settings';
export const API_NOTIFICATION_READ = (id: number) => `/notifications/${id}/read`;

// ─── ML SERVER (FastAPI – gọi thẳng, không qua /api) ─────────────────────────
export const API_ML_HEALTH                    = '/health';
export const API_ML_PREDICT                   = '/predict';

export const API_NOTIFICATIONS_TEST           = '/notifications/test';
export const API_NOTES                        = '/notes';
export const API_NOTE = (id: number) => `/notes/${id}`;

export const API_CONTRIB_MINE                 = '/contributions/mine';
export const API_CONTRIB_READING              = '/contributions/reading';
export const API_CONTRIB_VOCABULARY           = '/contributions/vocabulary';
export const API_CONTRIB_TEST_QUESTION        = '/contributions/test-questions';
export const API_CONTRIB_ITEM = (id: number) => `/contributions/${id}`;

export const API_LEARNING_PATHS                = '/learning-paths';
export const API_LEARNING_PATH = (id: number) => `/learning-paths/${id}`;
export const API_LEARNING_PATH_ENROLL = (id: number) => `/learning-paths/${id}/enroll`;

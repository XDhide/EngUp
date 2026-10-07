export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const CEFR_OPTIONS = [
  { value: 'A1', label: 'A1 - Sơ cấp' },
  { value: 'A2', label: 'A2 - Cơ bản' },
  { value: 'B1', label: 'B1 - Trung cấp' },
  { value: 'B2', label: 'B2 - Trung cao cấp' },
  { value: 'C1', label: 'C1 - Cao cấp' },
  { value: 'C2', label: 'C2 - Thành thạo' },
];
export const EXAM_TYPES = ['IELTS', 'TOEIC'];
export const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Trắc nghiệm' },
  { value: 'fill_blank', label: 'Điền từ' },
  { value: 'essay', label: 'Viết luận' },
  { value: 'speaking_prompt', label: 'Nói' },
];
export const CONTENT_TYPE_LABELS = { reading_article: 'Bài đọc', test_question: 'Câu hỏi đề thi', vocabulary_word: 'Từ vựng' };
export const LOG_LEVEL_LABELS = { info: 'Thông tin', warning: 'Cảnh báo', error: 'Lỗi', critical: 'Nghiêm trọng' };
export const NAV_ITEMS = [
  { to: '/', label: 'Tổng quan', end: true },
  { to: '/users', label: 'Người dùng' },
  { to: '/content', label: 'Học liệu' },
  { to: '/approval', label: 'Duyệt nội dung' },
  { to: '/tests', label: 'Đề thi' },
  { to: '/placement', label: 'Test đầu vào' },
  { to: '/system', label: 'Kiểm tra hệ thống' },
  { to: '/logs', label: 'Nhật ký' },
];

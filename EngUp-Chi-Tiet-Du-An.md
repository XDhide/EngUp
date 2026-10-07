# EngUp — Tài liệu chi tiết dự án

> Tổng hợp từ repo [`XDhide/EngUp` (nhánh `dev`)](https://github.com/XDhide/EngUp/tree/dev) và bản phân rã nhiệm vụ import Trello. Repo hiện mới có phần khung (scaffold) cho Backend và Mobile; tài liệu này thiết kế đầy đủ phần còn thiếu (schema DB, ML-Service, Admin-Web) theo đúng convention đã có sẵn trong repo.

---

## 1. Tổng quan

**EngUp** là ứng dụng học tiếng Anh cá nhân hoá, dùng thuật toán lặp lại ngắt quãng (Spaced Repetition) có hỗ trợ Machine Learning để dự đoán thời điểm ôn từ tối ưu cho từng người học.

| Thành phần | Vai trò | Trạng thái trong repo `dev` |
|---|---|---|
| **Backend** | REST API, Node.js + Express + MySQL | Đã có khung (server, DB pool, error middleware); các module nghiệp vụ (auth, vocabulary...) chưa code, mới có ở dạng thiết kế trong `Backend/Contructor.md` |
| **Mobile** | App học viên, Expo + React Native + TypeScript | Đã có khung mặc định từ `create-expo-app` (expo-router), chưa có màn hình nghiệp vụ |
| **ML-Service** | Dự đoán xác suất nhớ từ (Half-Life Regression) | Chưa tạo — nằm trong kế hoạch (Module ML-Service) |
| **Admin-Web** | Trang quản trị nội dung/người dùng | Chưa tạo — nằm trong kế hoạch |

Repo dùng mô hình nhánh: `main` (release) ← `dev` (tích hợp) ← `feature/<tên>` — mọi PR bắt buộc qua `dev`, có CI (`backend-ci.yml`, `mobile-ci.yml`) kiểm tra trước khi merge.

---

## 2. Tech stack (đọc từ code thật trong repo)

**Backend** (`Backend/package.json`):
- `express` 5.x, `mysql2` (promise pool), `jsonwebtoken`, `bcryptjs`
- `helmet`, `cors`, `express-rate-limit` (đã gắn sẵn trong `server.js`)
- Dev: `nodemon`

**Mobile** (`Mobile/package.json`):
- `expo` ~57, `expo-router`, `react` 19, `react-native` 0.86
- TypeScript, `expo lint`, `tsc --noEmit` chạy trong CI

**Quy ước response chuẩn của Backend** (theo `Backend/Contructor.md`, file `src/common/utils/response.js`):

```json
{ "success": true, "message": "mô tả ngắn", "data": { } }
```

Mọi API trong tài liệu này (mục 5) đều tuân theo format trên trừ khi ghi chú khác.

---

## 3. Kiến trúc thư mục Backend (đã có sẵn trong repo)

```
Backend/
├── src/
│   ├── modules/              # feature-based: auth/, vocabulary/... (chưa code)
│   │   └── <feature>/
│   │       ├── <feature>.controller.js
│   │       ├── <feature>.service.js
│   │       ├── <feature>.routes.js
│   │       └── <feature>.validation.js
│   ├── common/
│   │   ├── middlewares/      # auth.middleware.js, error.middleware.js (đã có)
│   │   ├── utils/             # generateToken.js, response.js
│   │   └── constants/roles.js
│   ├── config/db.js           # pool MySQL (đã có)
│   ├── routes/index.js        # gộp router mọi module (đã có, đang comment sẵn chỗ auth/vocabulary)
│   └── server.js              # entrypoint (đã có: helmet, cors, rate-limit, error middleware)
├── uploads/
├── tests/modules/
├── .env / .env.example
└── package.json
```

**Nguyên tắc bắt buộc khi thêm module mới:** mỗi module chỉ được sửa file trong thư mục `src/modules/<tên module>/` của chính nó, `src/routes/index.js` chỉ `router.use()` — không chứa logic. Điều này áp dụng đúng tinh thần "module độc lập" trong tài liệu này: **module A không được import trực tiếp `service.js` của module B**; nếu cần dữ liệu của module khác thì query read-only qua tầng data hoặc gọi API nội bộ, không gọi hàm business logic chéo module.

---

## 4. Danh sách 19 module (độc lập, không phụ thuộc runtime lẫn nhau)

Trước đây "User" từng là 1 module tách khỏi "Auth", buộc Auth phải gọi sang User để lấy/sửa hồ sơ. Thiết kế mới **gộp hồ sơ người dùng vào chung Module Auth** vì cả hai cùng thao tác trên một bảng `users` — tách ra chỉ tạo phụ thuộc chéo không cần thiết. Module khác (Vocabulary, Notebook...) chỉ được **tham chiếu `users.id` qua khoá ngoại**, không gọi hàm nghiệp vụ của Auth.

| # | Module | Bảng sở hữu chính | Phụ thuộc module khác (chỉ qua FK/đọc read-only) |
|---|---|---|---|
| 1 | **Database** | (thiết kế toàn bộ schema — xem `database_schema.sql`) | — |
| 2 | **Auth** | `users`, `refresh_tokens`, `placement_test_results` | Không |
| 3 | **Vocabulary** | `vocabulary_topics`, `vocabulary_words`, `user_vocabulary_cards`, `review_logs` | FK → `users`; gọi HTTP tới ML-Service `/predict` (có fallback) |
| 4 | **Notebook** | `personal_notebook_entries` | FK → `users`, `vocabulary_words` |
| 5 | **Reading** | `reading_articles`, `reading_questions`, `reading_attempts` | FK → `users`; ghi vào hàng chờ của Admin Approval |
| 6 | **Listening** | `listening_lessons`, `listening_dictation_attempts` | FK → `users` |
| 7 | **ML-Service** | `ml_prediction_logs` | Đọc read-only `review_logs` để train (không gọi API Vocabulary) |
| 8 | **Writing** | `writing_prompts`, `writing_submissions` | FK → `users` |
| 9 | **Test Practice** | `test_sets`, `test_questions`, `user_test_attempts` | FK → `users`; dùng chung engine chấm AI của Writing qua thư viện dùng chung |
| 10 | **Statistics** | `streaks` | Đọc read-only từ Vocabulary/Reading/Listening |
| 11 | **Notifications** | `notification_settings`, `notifications`, `notification_templates` | Đọc read-only `next_review_at` từ Vocabulary |
| 12 | **Admin Auth** | (dùng chung `users.role`) | FK → `users` |
| 13 | **Admin Users** | — | Đọc read-only tiến độ từ các module học tập |
| 14 | **Admin Content** | — | CRUD trên bảng của Vocabulary/Reading/Listening với quyền admin |
| 15 | **Admin Approval** | `admin_content_approval_queue` | FK → nội dung của Reading/Test Practice |
| 16 | **Admin Test Bank** | — | CRUD trên bảng của Test Practice |
| 17 | **Admin Logs** | `error_logs` | Nhận log từ mọi service khác qua API, không đọc DB trực tiếp |
| 18 | **Admin Dashboard** | `notification_templates`, `subscription_plans`, `subscriptions` | Tổng hợp read-only toàn hệ thống |
| 19 | **DevOps** | — | Hạ tầng CI/CD, docker-compose, không đụng nghiệp vụ |

---

## 5. Thiết kế Database

Toàn bộ schema nằm trong file đính kèm **`database_schema.sql`** (MySQL 8, InnoDB, utf8mb4). Tóm tắt nhóm bảng:

- **Auth**: `users`, `refresh_tokens`, `placement_test_results`
- **Vocabulary/SRS**: `vocabulary_topics`, `vocabulary_words`, `user_vocabulary_cards` (có sẵn cột `half_life_hours`, `recall_probability` cho ML-Service), `review_logs`
- **Notebook**: `personal_notebook_entries`
- **Reading**: `reading_articles`, `reading_questions`, `reading_attempts`
- **Listening**: `listening_lessons`, `listening_dictation_attempts`
- **ML-Service**: `ml_prediction_logs`
- **Writing**: `writing_prompts`, `writing_submissions`
- **Test Practice**: `test_sets`, `test_questions`, `user_test_attempts`
- **Statistics**: `streaks`
- **Notifications**: `notification_settings`, `notifications`, `notification_templates`
- **Admin**: `audit_logs`, `admin_content_approval_queue`, `error_logs`
- **Tương lai**: `subscription_plans`, `subscriptions`

Quy tắc khoá ngoại: `ON DELETE CASCADE` cho dữ liệu phụ thuộc trực tiếp vào 1 user (card, log, note, submission...); `ON DELETE SET NULL` cho quan hệ tuỳ chọn (vd. `reading_articles.created_by` trỏ tới admin).

---

## 6. Chi tiết API theo module (Input / Output)

> Format Output mặc định: `{ success, message, data }`. Các case đặc biệt (lỗi, quota, timeout) được ghi chú riêng.

### 6.1 Module Auth
| API | Input | Output |
|---|---|---|
| `POST /api/auth/register` | `{ email, password (min 8), full_name }` | `data.user`, `access_token`, `refresh_token`; 409 nếu email trùng |
| `POST /api/auth/login` | `{ email, password }` | `data.user`, `access_token`, `refresh_token`; 401 nếu sai |
| `POST /api/auth/refresh` | `{ refresh_token }` | `data.access_token`; 401 nếu token bị thu hồi/hết hạn |
| `POST /api/auth/logout` | `{ refresh_token }` + Bearer | `data: null`, thu hồi token |
| `GET /api/auth/me` | Bearer token | `data`: hồ sơ đầy đủ |
| `PUT /api/auth/me` | `{ level_current?, learning_goal?, daily_target_minutes? }` | `data`: hồ sơ sau cập nhật |
| `GET /api/auth/placement-test/questions` | — | `data.questions[]` |
| `POST /api/auth/placement-test/submit` | `{ answers[] }` | `data.suggested_level`, cập nhật `users.level_current` |

### 6.2 Module Vocabulary
| API | Input | Output |
|---|---|---|
| `GET /api/vocabulary/topics` | — | `data.topics[]` |
| `GET /api/vocabulary/words` | Query `topic_id, difficulty, limit, offset` | `data.words[]`, `total` |
| `POST/PUT/DELETE /api/vocabulary/words(/:id)` | body từ vựng (admin) | `data`: bản ghi sau thao tác |
| `GET /api/review/today` | Bearer | `data.cards[]` (gọi ML-Service `/predict`, fallback SM-2) |
| `POST /api/review/submit` | `{ card_id, result, response_time_ms }` | `data.next_review_at, interval_days` |
| `GET /api/vocabulary/new-words` | Query `limit` | `data.words[]` giới hạn theo `daily_new_word_limit` |
| `PUT /api/vocabulary/daily-new-word-limit` | `{ limit }` | `data.daily_new_word_limit` |

### 6.3 Module Notebook
| API | Input | Output |
|---|---|---|
| `POST /api/notebook` | `{ word_id, source_type, source_id?, note?, tags? }` | `data`: entry mới (tự tạo SRS card nếu chưa có) |
| `GET /api/notebook` | Query `source_type, tag, date_from, date_to` | `data.entries[]` |
| `PUT/DELETE /api/notebook/:id` | `{ note?, tags? }` | `data`: entry sau sửa / `null` sau xoá |

### 6.4 Module Reading
| API | Input | Output |
|---|---|---|
| `GET /api/reading/articles` | Query `difficulty, topic` | `data.articles[]` (chỉ bài đã duyệt) |
| `GET /api/reading/articles/:id` | — | `data`: bài + câu hỏi (ẩn đáp án đúng) |
| `POST /api/reading/articles/:id/submit` | `{ answers[] }` | `data.score, correct_count, review[]` |
| `POST /api/reading/generate` (admin) | `{ topic, difficulty }` | `data`: bài mới `is_approved=false`, vào hàng chờ duyệt |

### 6.5 Module Listening
| API | Input | Output |
|---|---|---|
| `GET /api/listening/lessons(/:id)` | Query `difficulty, topic` | `data.lessons[]` / `data`: chi tiết + transcript |
| `POST /api/listening/lessons/:id/dictation` | `{ user_text }` | `data.accuracy_percent, wrong_words[]` |

### 6.6 Module ML-Service
| API | Input | Output |
|---|---|---|
| `POST /predict` | `{ user_id, word_id, review_history[] }` | `data.recall_probability, next_review_at` (fallback SM-2 nếu cold-start) |
| `POST /retrain` | — (cron) | `{ model_version, trained_at }` |
| `GET /health` | — | `{ status: "ok" }` |

### 6.7 Module Writing
| API | Input | Output |
|---|---|---|
| `GET /api/writing/prompts` | Query `type` | `data.prompts[]` |
| `POST /api/writing/submissions` | `{ prompt_id, content }` | `data.ai_feedback, ai_score` (504 nếu LLM timeout); 429 nếu vượt quota/ngày |
| `GET /api/writing/submissions(/:id)` | Query `limit, offset` | `data.submissions[]` / chi tiết 1 bài |

### 6.8 Module Test Practice
| API | Input | Output |
|---|---|---|
| `GET /api/tests` | Query `exam_type, section` | `data.test_sets[]` |
| `GET /api/tests/:id/questions` | — | `data.questions[]` (ẩn đáp án) |
| `POST /api/tests/:id/start` | — | `data.attempt_id, started_at` |
| `POST /api/tests/:id/submit` | `{ attempt_id, answers[] }` | `data.score, band_score` |
| `POST /api/tests/:id/submit-writing` | `{ attempt_id, content }` | `data.band_score, feedback` |
| `GET /api/tests/attempts(/:id/result)` | Query `limit, offset` | `data.attempts[]` / kết quả chi tiết |

### 6.9 Module Statistics
| API | Input | Output |
|---|---|---|
| `GET /api/stats/overview` | — | `data`: tổng hợp học tập (read-only) |
| `GET /api/stats/progress` | Query `range=7d\|30d\|all` | `data.timeline[]` |

### 6.10 Module Notifications
| API | Input | Output |
|---|---|---|
| `GET/PUT /api/notifications/settings` | `{ daily_reminder_time?, review_reminder_enabled?, push_token? }` | `data`: settings |
| `GET /api/notifications` | Query `is_read` | `data.notifications[]` |
| `PUT /api/notifications/:id/read` | — | `data: null`, đánh dấu đã đọc |

### 6.11–6.18 Các module Admin
Xem chi tiết đầy đủ Input/Output trong file `import_engup_trello.py` (mỗi API đều có `input`/`output` gắn kèm) — bao gồm: Admin Auth (login, `requireRole`), Admin Users (danh sách/khoá tài khoản/tiến độ), Admin Content (CRUD học liệu), Admin Approval (duyệt/từ chối), Admin Test Bank (CRUD đề thi), Admin Logs (lỗi hệ thống + audit log), Admin Dashboard (mẫu thông báo, tổng quan hệ thống, gói cước tương lai).

---

## 7. Cách dùng script import Trello

File **`import_engup_trello.py`** sẽ:
1. Xoá toàn bộ card cũ trong cột **"To do"** của board `https://trello.com/b/EPDFHxQw/engup`.
2. Tạo lại **19 card**, mỗi card = 1 module độc lập, tên dạng `Module <Tên>` (vd: `Module Database`, `Module Auth`...).
3. Card `Module Database` luôn được tạo đầu tiên.
4. Mỗi card có mô tả gồm: bảng dữ liệu module đó sở hữu, nguyên tắc độc lập, và từng nhiệm vụ kèm API có **Input** và **Output** rõ ràng.

Chạy:
```bash
pip install requests
python3 import_engup_trello.py
```

> Lưu ý bảo mật: `API_KEY`/`TOKEN` trong file đang là giá trị thật của bạn — nên chuyển sang biến môi trường (`.env`) và **không commit file này lên Git** ở dạng hiện tại.

---

## 8. Việc cần làm tiếp (gap giữa repo hiện tại và thiết kế này)

- [ ] Chạy `database_schema.sql` lên MySQL, cập nhật `Backend/src/config/db.js` nếu cần.
- [ ] Tạo các thư mục `src/modules/auth`, `src/modules/vocabulary`... theo đúng cấu trúc trong `Contructor.md`.
- [ ] Bỏ comment 2 dòng route mẫu trong `src/routes/index.js` khi module tương ứng xong.
- [ ] Khởi tạo repo/service riêng cho **ML-Service** (Python, ví dụ FastAPI) và **Admin-Web**.
- [ ] Thêm `ml-ci.yml`, `admin-ci.yml` cạnh `backend-ci.yml`, `mobile-ci.yml` hiện có.

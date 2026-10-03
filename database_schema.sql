-- ============================================================================
-- EngUp — Database Schema (MySQL 8+)
-- Thiết kế dựa trên toàn bộ nghiệp vụ đã liệt kê trong bản phân rã module
-- (Auth, Vocabulary/SRS, Notebook, Reading, Listening, ML-Service, Writing,
--  Test Practice, Stats, Notifications, Admin*, DevOps)
--
-- Nguyên tắc thiết kế:
--   1. Mỗi module SỞ HỮU (owns) đúng các bảng của nó — module khác chỉ được
--      phép tham chiếu qua FK (khoá ngoại), KHÔNG được gọi thẳng vào service
--      của module kia. Vì vậy "Module Auth" không cần "sang" module User:
--      toàn bộ thông tin định danh + hồ sơ nằm chung trong bảng `users`.
--   2. Mọi bảng có created_at; bảng có thể sửa có thêm updated_at.
--   3. Dùng InnoDB + utf8mb4 để hỗ trợ tiếng Việt & emoji.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- MODULE AUTH  (đăng ký / đăng nhập / hồ sơ / placement test)
-- Đây là bảng lõi mà các module khác chỉ được FK tới, không được sửa trực tiếp.
-- ============================================================================

CREATE TABLE users (
  id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email                   VARCHAR(255) NOT NULL UNIQUE,
  password_hash           VARCHAR(255) NOT NULL,
  full_name               VARCHAR(150) NOT NULL,
  role                    ENUM('student','admin') NOT NULL DEFAULT 'student',
  level_current           VARCHAR(10)  NULL COMMENT 'A1..C2, kết quả placement test hoặc admin gán',
  learning_goal           VARCHAR(255) NULL,
  daily_target_minutes    SMALLINT UNSIGNED NULL DEFAULT 15,
  daily_new_word_limit    SMALLINT UNSIGNED NOT NULL DEFAULT 10,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE refresh_tokens (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  token_hash    VARCHAR(255) NOT NULL,
  expires_at    DATETIME NOT NULL,
  revoked_at    DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE placement_test_results (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  answers           JSON NOT NULL,
  suggested_level   VARCHAR(10) NOT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_placement_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- MODULE VOCABULARY (từ vựng + SRS)
-- ============================================================================

CREATE TABLE vocabulary_topics (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  description   VARCHAR(500) NULL,
  image_url     VARCHAR(500) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE vocabulary_words (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic_id          BIGINT UNSIGNED NULL,
  word              VARCHAR(150) NOT NULL,
  phonetic          VARCHAR(150) NULL,
  meaning           VARCHAR(500) NOT NULL,
  example_sentence  TEXT NULL,
  audio_url         VARCHAR(500) NULL,
  difficulty        VARCHAR(10) NULL COMMENT 'A1..C2',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_word_topic FOREIGN KEY (topic_id) REFERENCES vocabulary_topics(id) ON DELETE SET NULL,
  INDEX idx_word_topic (topic_id),
  INDEX idx_word_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_vocabulary_cards (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  word_id           BIGINT UNSIGNED NOT NULL,
  ease_factor       DECIMAL(4,2) NOT NULL DEFAULT 2.50 COMMENT 'dùng khi fallback SM-2',
  interval_days     INT UNSIGNED NOT NULL DEFAULT 0,
  repetitions       INT UNSIGNED NOT NULL DEFAULT 0,
  half_life_hours   DECIMAL(10,2) NULL COMMENT 'dùng cho model Half-Life Regression (ML-Service)',
  recall_probability DECIMAL(5,4) NULL COMMENT 'kết quả /predict gần nhất',
  next_review_at    DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_card_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_card_word FOREIGN KEY (word_id) REFERENCES vocabulary_words(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_word (user_id, word_id),
  INDEX idx_card_next_review (user_id, next_review_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE review_logs (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  card_id           BIGINT UNSIGNED NOT NULL,
  user_id           BIGINT UNSIGNED NOT NULL,
  word_id           BIGINT UNSIGNED NOT NULL,
  result            ENUM('again','hard','good','easy') NOT NULL,
  response_time_ms  INT UNSIGNED NULL,
  reviewed_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_card FOREIGN KEY (card_id) REFERENCES user_vocabulary_cards(id) ON DELETE CASCADE,
  CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_log_word FOREIGN KEY (word_id) REFERENCES vocabulary_words(id) ON DELETE CASCADE,
  INDEX idx_log_user_date (user_id, reviewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- MODULE NOTEBOOK (sổ tay từ mới)
-- ============================================================================

CREATE TABLE personal_notebook_entries (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  word_id       BIGINT UNSIGNED NOT NULL,
  source_type   ENUM('vocabulary','reading','listening','manual') NOT NULL DEFAULT 'manual',
  source_id     BIGINT UNSIGNED NULL COMMENT 'id bài đọc/nghe nếu source_type tương ứng',
  note          TEXT NULL,
  tags          JSON NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notebook_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notebook_word FOREIGN KEY (word_id) REFERENCES vocabulary_words(id) ON DELETE CASCADE,
  INDEX idx_notebook_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- MODULE READING (đọc hiểu)
-- ============================================================================

CREATE TABLE reading_articles (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  content           TEXT NOT NULL,
  difficulty        VARCHAR(10) NULL,
  topic             VARCHAR(150) NULL,
  is_ai_generated   BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved       BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'FALSE nếu do AI sinh và đang chờ admin duyệt',
  created_by        BIGINT UNSIGNED NULL COMMENT 'admin tạo tay, NULL nếu do AI sinh',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_article_admin FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_article_filter (difficulty, topic, is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reading_questions (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id        BIGINT UNSIGNED NOT NULL,
  question_text     TEXT NOT NULL,
  options           JSON NOT NULL COMMENT '["A. ...","B. ...","C. ...","D. ..."]',
  correct_answer    VARCHAR(10) NOT NULL,
  explanation       TEXT NULL,
  CONSTRAINT fk_question_article FOREIGN KEY (article_id) REFERENCES reading_articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reading_attempts (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  article_id        BIGINT UNSIGNED NOT NULL,
  answers           JSON NOT NULL,
  score             DECIMAL(5,2) NOT NULL,
  correct_count     INT UNSIGNED NOT NULL,
  total_count       INT UNSIGNED NOT NULL,
  submitted_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempt_article FOREIGN KEY (article_id) REFERENCES reading_articles(id) ON DELETE CASCADE,
  INDEX idx_reading_attempt_user (user_id, submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- MODULE LISTENING (nghe)
-- ============================================================================

CREATE TABLE listening_lessons (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  audio_url     VARCHAR(500) NOT NULL,
  transcript    TEXT NOT NULL,
  difficulty    VARCHAR(10) NULL,
  topic         VARCHAR(150) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_listening_filter (difficulty, topic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE listening_dictation_attempts (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  lesson_id         BIGINT UNSIGNED NOT NULL,
  user_text         TEXT NOT NULL,
  accuracy_percent  DECIMAL(5,2) NOT NULL,
  wrong_words       JSON NULL,
  submitted_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dictation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_dictation_lesson FOREIGN KEY (lesson_id) REFERENCES listening_lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- MODULE ML-SERVICE
-- ============================================================================

CREATE TABLE ml_prediction_logs (
  id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id                 BIGINT UNSIGNED NOT NULL,
  word_id                 BIGINT UNSIGNED NOT NULL,
  recall_probability      DECIMAL(5,4) NOT NULL,
  predicted_next_review_at DATETIME NOT NULL,
  used_fallback_sm2       BOOLEAN NOT NULL DEFAULT FALSE,
  model_version           VARCHAR(50) NULL,
  actual_result           ENUM('again','hard','good','easy') NULL COMMENT 'điền sau khi user thực sự ôn, dùng để đo độ chính xác',
  predicted_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ml_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ml_log_word FOREIGN KEY (word_id) REFERENCES vocabulary_words(id) ON DELETE CASCADE,
  INDEX idx_ml_log_user (user_id, predicted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- MODULE WRITING
-- ============================================================================

CREATE TABLE writing_prompts (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  prompt_text   TEXT NOT NULL,
  type          ENUM('free','ielts','toeic') NOT NULL DEFAULT 'free',
  difficulty    VARCHAR(10) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE writing_submissions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  prompt_id     BIGINT UNSIGNED NOT NULL,
  content       TEXT NOT NULL,
  ai_feedback   JSON NULL COMMENT '{overall_comment, grammar_errors:[...], vocabulary_suggestions:[...], band_estimate}',
  ai_score      DECIMAL(5,2) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_submission_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_prompt FOREIGN KEY (prompt_id) REFERENCES writing_prompts(id) ON DELETE CASCADE,
  INDEX idx_writing_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- MODULE TEST PRACTICE (IELTS/TOEIC)
-- ============================================================================

CREATE TABLE test_sets (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  exam_type             ENUM('IELTS','TOEIC') NOT NULL,
  section               VARCHAR(50) NOT NULL COMMENT 'Listening, Reading, Writing, Speaking...',
  title                 VARCHAR(255) NOT NULL,
  time_limit_minutes    INT UNSIGNED NOT NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE test_questions (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  test_set_id       BIGINT UNSIGNED NOT NULL,
  question_text     TEXT NOT NULL,
  question_type     VARCHAR(50) NOT NULL COMMENT 'multiple_choice, fill_blank, essay, speaking_prompt...',
  options           JSON NULL,
  correct_answer    VARCHAR(255) NULL,
  audio_url         VARCHAR(500) NULL,
  passage_text      TEXT NULL,
  order_index       INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_testq_set FOREIGN KEY (test_set_id) REFERENCES test_sets(id) ON DELETE CASCADE,
  INDEX idx_testq_set (test_set_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_test_attempts (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  test_set_id   BIGINT UNSIGNED NOT NULL,
  answers       JSON NULL,
  started_at    DATETIME NOT NULL,
  submitted_at  DATETIME NULL,
  score         DECIMAL(5,2) NULL,
  band_score    DECIMAL(3,1) NULL COMMENT 'quy đổi IELTS band hoặc điểm TOEIC',
  status        ENUM('in_progress','submitted') NOT NULL DEFAULT 'in_progress',
  CONSTRAINT fk_attempt_test_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempt_test_set FOREIGN KEY (test_set_id) REFERENCES test_sets(id) ON DELETE CASCADE,
  INDEX idx_test_attempt_user (user_id, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- MODULE STATISTICS
-- ============================================================================

CREATE TABLE streaks (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL UNIQUE,
  current_streak    INT UNSIGNED NOT NULL DEFAULT 0,
  longest_streak    INT UNSIGNED NOT NULL DEFAULT 0,
  last_active_date  DATE NULL,
  frozen_until      DATE NULL COMMENT 'cho phép đóng băng streak khi user nghỉ có phép',
  CONSTRAINT fk_streak_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- MODULE NOTIFICATIONS
-- ============================================================================

CREATE TABLE notification_settings (
  id                        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id                   BIGINT UNSIGNED NOT NULL UNIQUE,
  daily_reminder_time       TIME NULL,
  review_reminder_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  push_token                VARCHAR(255) NULL COMMENT 'Expo push token',
  CONSTRAINT fk_notif_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(255) NOT NULL,
  body          TEXT NOT NULL,
  type          VARCHAR(50) NOT NULL COMMENT 'daily_reminder, review_due, system...',
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notification_user (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification_templates (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(100) NOT NULL UNIQUE,
  title_template    VARCHAR(255) NOT NULL,
  body_template     TEXT NOT NULL,
  type              VARCHAR(50) NOT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- MODULE ADMIN (Auth/Users/Content/Approval/TestBank/Logs/Dashboard)
-- role admin đã có sẵn trong bảng users -> Admin Auth không cần bảng riêng.
-- ============================================================================

CREATE TABLE audit_logs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id      BIGINT UNSIGNED NOT NULL COMMENT 'admin thực hiện hành động',
  action        VARCHAR(100) NOT NULL COMMENT 'vd: user.status.update, content.approve...',
  target_type   VARCHAR(50) NOT NULL COMMENT 'user, reading_article, test_question...',
  target_id     BIGINT UNSIGNED NOT NULL,
  detail        JSON NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_audit_actor_date (actor_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE admin_content_approval_queue (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content_type  ENUM('reading_article','test_question') NOT NULL,
  content_id    BIGINT UNSIGNED NOT NULL,
  status        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reject_reason VARCHAR(500) NULL,
  reviewed_by   BIGINT UNSIGNED NULL,
  reviewed_at   DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_queue_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_queue_status (status, content_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE error_logs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service       ENUM('backend','ml-service') NOT NULL,
  level         ENUM('info','warning','error','critical') NOT NULL DEFAULT 'error',
  message       TEXT NOT NULL,
  stack_trace   TEXT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_error_service_date (service, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- (Tương lai) MODULE SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE subscription_plans (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  price         DECIMAL(10,2) NOT NULL,
  duration_days INT UNSIGNED NOT NULL,
  features      JSON NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE subscriptions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  plan_id       BIGINT UNSIGNED NOT NULL,
  status        ENUM('active','expired','cancelled') NOT NULL DEFAULT 'active',
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

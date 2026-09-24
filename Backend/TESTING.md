# Hướng dẫn Test API & Seed dữ liệu mẫu

Đã thêm 2 phần vào project:

```
backend/
├── src/
│   └── common/
│       └── seed/
│           └── seed.js   <- tạo dữ liệu mẫu (users, vocab, reading, listening, writing)
└── test/
    ├── test_api.py       <- test toàn bộ API bằng Python (tích hợp, cần server + DB)
    ├── helpers/
    │   ├── approval_fixtures.js      <- tạo/kiểm tra/dọn dữ liệu thử cho test duyệt nội dung
    │   └── admin_tests_fixtures.js   <- tạo/dọn lượt làm bài thử cho test thống kê đề thi
    └── unit/             <- unit test (node:test), KHÔNG cần MySQL
        ├── admin-approval.service.test.js
        ├── admin-approval.http.test.js
        ├── admin-tests.service.test.js
        └── admin-tests.http.test.js
```

## 1. Cài đặt

```bash
# Cài dependency Node (nếu chưa cài)
npm install

# Cài thư viện Python cần thiết (chỉ cần "requests")
pip install requests --break-system-packages
```

Đảm bảo file `.env` đã trỏ đúng MySQL (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

## 2. Tạo cấu trúc bảng (nếu chưa có)

```bash
npm run db:sync
```

Nếu database đã có sẵn từ trước, chạy migration để thêm phần mới của module
`admin-approval` (an toàn khi chạy lại nhiều lần):

```bash
npm run migrate
```

Migration này (a) tạo bảng `admin_content_approval_queue` nếu chưa có và
(b) thêm cột `test_questions.is_approved` (mặc định `true`, nên các câu hỏi hiện có
vẫn hiển thị như cũ). Rollback từng bước bằng `npm run migrate:down`.

## 3. Seed dữ liệu mẫu

```bash
node src/common/seed/seed.js
# hoặc
npm run db:seed
```

Script sẽ tạo (an toàn khi chạy lại nhiều lần — không tạo trùng):

- 3 tài khoản:
  - `admin@engup.test` / `Admin@123` (role: admin)
  - `student1@engup.test` / `Student@123` (role: student)
  - `student2@engup.test` / `Student@123` (role: student)
- 2 chủ đề từ vựng (Travel, Business) + 6 từ vựng mẫu
- 2 bài đọc (kèm câu hỏi trắc nghiệm)
- 2 bài nghe (kèm transcript)
- 2 đề bài viết (1 free, 1 IELTS)

## 4. Chạy server

```bash
npm run start
# hoặc
npm run dev
```

## 5. Chạy test API

```bash
python test/test_api.py
```

Nếu server chạy ở cổng/host khác:

```bash
python test/test_api.py --base-url http://localhost:5000/api
```

## Lưu ý về các API phụ thuộc dịch vụ ngoài

Hai endpoint sau gọi ra dịch vụ AI bên ngoài (Gemini) và sẽ trả về lỗi
`502` nếu bạn **chưa** cấu hình API key/URL tương ứng trong `.env`. Script
test sẽ tự động đánh dấu các test này là **SKIP** (không tính là lỗi code)
khi gặp mã 502:

| Endpoint | Biến môi trường cần cấu hình |
|---|---|
| `POST /api/reading/generate` | `AI_GENERATION_URL` |
| `POST /api/writing/submissions` | `WRITING_LLM_API_KEY` (Gemini API key) |

Nếu bạn cấu hình đầy đủ các biến trên, test script sẽ kiểm tra các API này
như bình thường (mong đợi status `201`).

## Unit test (không cần DB / server)

```bash
npm run test:unit
```

Dùng test runner có sẵn của Node (`node:test`, cần Node 18+), không thêm dependency.
Hiện bao phủ module `admin-approval` và `admin-tests`: logic service (404 / 409 / transaction /
audit log) và tầng HTTP (JWT, phân quyền admin, validation, định dạng response).

## Test module duyệt nội dung (`/api/admin/content`)

Phần `=== 9. ADMIN CONTENT APPROVAL ===` trong `test_api.py` kiểm tra đủ 3 endpoint:

| Endpoint | Kiểm tra |
|---|---|
| `GET /api/admin/content/pending[?type=]` | 401 / 403, lọc theo `type`, `type` sai -> 400, shape `{id, content_type, content_id, created_at}` |
| `PUT /api/admin/content/:id/approve` | 200 + `data=null`, `is_approved=true` ở bảng nội dung, 404, 409 khi xử lý lại |
| `PUT /api/admin/content/:id/reject` | 200 + `data=null`, `reject_reason` bắt buộc (<= 500 ký tự), 404, 409 |

Hiện chưa có API nào để đưa nội dung vào hàng chờ (ngoài `POST /reading/generate` cần AI thật),
nên test tự tạo dữ liệu thử trực tiếp vào DB qua `test/helpers/approval_fixtures.js`
(cần `node` trong PATH và `.env` trỏ đúng DB) rồi **tự dọn sạch** sau khi chạy.
Nếu không tạo được dữ liệu thử, các kịch bản duyệt/từ chối được đánh dấu SKIP.

## Test module quản trị đề thi (`/api/admin/tests`)

Phần `=== 10. ADMIN TESTS ===` trong `test_api.py`:

| Endpoint | Kiểm tra |
|---|---|
| `POST/PUT/DELETE /api/admin/tests/test-sets[/:id]` | 201 / 200, `data` = đề sau thao tác (DELETE trả đề vừa xoá), validation, 404, **409 khi xoá đề đã có lượt làm bài**, câu hỏi bị xoá theo đề |
| `POST/PUT/DELETE /api/admin/tests/questions[/:id]` | như trên; `multiple_choice` bắt buộc có `options` (>= 2) + `correct_answer`, `fill_blank` bắt buộc có `correct_answer`; PUT cập nhật từng phần và kiểm tra ràng buộc trên bản ghi đã gộp |
| `GET /api/admin/tests/attempts?test_set_id=` | `test_set_id` bắt buộc (400 / 404), `attempts[]` chỉ gồm `{user_id, score, band_score, status}` với điểm dạng số, `completion_rate` = % lượt đã nộp (0 nếu chưa có lượt nào) |

Lượt làm bài của học viên được tạo trực tiếp vào DB qua `test/helpers/admin_tests_fixtures.js`
(cần các tài khoản `student1/student2` do `npm run db:seed` tạo), và được dọn sạch sau khi chạy.

## Giới hạn request khi chạy `test_api.py`

`/api` giới hạn 100 request / 15 phút cho mỗi IP, nhưng một lần chạy toàn bộ `test_api.py`
dùng khoảng **120 request**. Hãy khởi động server với giới hạn cao hơn (biến môi trường
`RATE_LIMIT_MAX`, mặc định vẫn là 100 nên không ảnh hưởng khi chạy thật):

```powershell
# PowerShell (Windows)
$env:RATE_LIMIT_MAX=1000; npm run start
```

```bash
# bash / macOS / Linux
RATE_LIMIT_MAX=1000 npm run start
```

Nếu quên, các test cuối sẽ FAIL với HTTP 429 và báo rõ nguyên nhân này.

## Đọc kết quả test

Script in ra từng dòng test dạng:

```
[PASS] GET /vocabulary/topics — HTTP 200
[FAIL] POST /writing/submissions — HTTP 500 | body: {...}
[SKIP] POST /reading/generate — Trả về 502 vì chưa cấu hình AI_GENERATION_URL...
```

Cuối cùng là bảng tổng kết số lượng PASS / FAIL / SKIP. Script thoát với mã
`1` nếu có bất kỳ test nào FAIL (hữu ích khi dùng trong CI).

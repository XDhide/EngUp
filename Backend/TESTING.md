# Hướng dẫn Test API & Seed dữ liệu mẫu

Đã thêm 2 phần vào project:

```
backend/
├── src/
│   └── common/
│       └── seed/
│           └── seed.js   <- tạo dữ liệu mẫu (users, vocab, reading, listening, writing)
└── test/
    └── test_api.py       <- test toàn bộ API bằng Python
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

## Đọc kết quả test

Script in ra từng dòng test dạng:

```
[PASS] GET /vocabulary/topics — HTTP 200
[FAIL] POST /writing/submissions — HTTP 500 | body: {...}
[SKIP] POST /reading/generate — Trả về 502 vì chưa cấu hình AI_GENERATION_URL...
```

Cuối cùng là bảng tổng kết số lượng PASS / FAIL / SKIP. Script thoát với mã
`1` nếu có bất kỳ test nào FAIL (hữu ích khi dùng trong CI).

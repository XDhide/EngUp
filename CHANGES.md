# Thay đổi: hoàn thiện giao diện Mobile & kết nối API Backend

## Mobile
**Màn hình mới:** Thống kê (tab), Nghe chép, Viết AI (soạn bài, nhận xét, lịch sử), Luyện đề (tính giờ, kết quả, lịch sử), Thông báo & nhắc học, nút "Thêm từ mới" trong Sổ tay.
**Thanh tab** theo `DESIGN.md`: Trang chủ · Từ vựng · Luyện tập · Thống kê · Cá nhân (Sổ tay vào từ Từ vựng và Cá nhân).
**Kết nối API:** bỏ toàn bộ dữ liệu mock/số giả; mọi service khớp đúng response thật của Backend (xem `Mobile/src/services/`).
- `apiClient`: địa chỉ API từ `EXPO_PUBLIC_API_URL` → IP máy chạy Expo → emulator/localhost; refresh token dùng chung một request; hết phiên thì tự đăng xuất về màn đăng nhập.
- Đăng nhập/đăng ký lấy hồ sơ đầy đủ qua `/auth/me`; mật khẩu tối thiểu 8 ký tự; bỏ tài khoản demo và "Trải nghiệm trước".
- Placement test gửi `answer` = `option.id`; đọc hiểu gửi chữ cái đáp án (A/B/C/D).
- Flashcard đo thời gian phản hồi thật, không chuyển thẻ nếu server chưa ghi nhận.
- Audio dùng `expo-audio` (đã thêm vào `package.json`).

## Backend (chỉ thêm, không đổi field cũ)
- `routes/index.js`: mount `/api/tests` và `/api/notifications` (trước đó có code nhưng chưa được gắn nên trả 404).
- `GET /notebook`: kèm `word` (từ vựng) cho từng entry.
- `GET /review/today`: thêm `word_id, phonetic, example_sentence, audio_url, difficulty, interval_days, repetitions`.
- `GET /vocabulary/new-words`: thêm `daily_limit`, `learned_today`. `GET /vocabulary/words`: thêm `difficulty`, `topic_id`.
- **Sửa lỗi:** `user_test_attempts.band_score` từ `DECIMAL(3,1)` lên `DECIMAL(5,1)` — điểm TOEIC (tới 990) làm nộp đề TOEIC lỗi SQL. **Cần chạy `npm run db:sync`.**
- `seed.js`: thêm 3 đề thi mẫu (IELTS Reading, TOEIC Part 5, IELTS Writing).

## Chạy thử
1. `cd Backend && npm run db:sync && npm run db:seed && npm start`
2. `cd Mobile && cp .env.example .env && npm install && npx expo start`
3. Tài khoản seed: `student1@engup.test` / `Student@123`

## Giới hạn đã biết (do Backend chưa hỗ trợ)
- Chấm Viết AI cần `WRITING_LLM_API_KEY` trong `Backend/.env`; nếu trống app hiển thị thông báo lỗi từ server.
- Danh sách bài đọc/chủ đề chưa có tiến độ, số phút đọc, số câu hỏi → UI không hiển thị các số này.
- "Đã biết" ở màn Từ mới chỉ bỏ qua tại chỗ; từ đó vẫn xuất hiện lại vì backend chỉ ghi nhận thẻ khi lưu sổ tay.
- Streak chỉ cập nhật bởi cron hằng ngày (00:10) nên không tăng ngay trong ngày.
- `audio_url` trong seed là `example.com` nên nghe chép chỉ phát được khi có file audio thật.
- Đề trắc nghiệm chấm khớp chuỗi chính xác (phân biệt hoa/thường ở câu điền từ).

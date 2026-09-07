# Cấu trúc thư mục hoàn chỉnh — EngUp Backend

```
Backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.validation.js
│   │   │
│   │   ├── user/
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.routes.js
│   │   │   └── user.validation.js
│   │   │
│   │   ├── vocabulary/
│   │   │   ├── vocabulary.controller.js
│   │   │   ├── vocabulary.service.js
│   │   │   ├── vocabulary.routes.js
│   │   │   └── vocabulary.validation.js
│   │   │
│   ├── common/
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── utils/
│   │   │   ├── generateToken.js
│   │   │   └── response.js
│   │   └── constants/
│   │       └── roles.js
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── routes/
│   │   └── index.js
│   │
│   └── server.js
│
├── uploads/
├── tests/
│   └── modules/
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Giải thích từng thư mục

### `src/`
Thư mục gốc chứa toàn bộ mã nguồn của ứng dụng. Mọi thứ liên quan đến logic chạy app đều nằm trong đây, tách biệt với file cấu hình dự án ở ngoài (`package.json`, `.env`...).

### `src/modules/`
Trái tim của dự án theo mô hình **feature-based** — mỗi tính năng nghiệp vụ (auth, vocabulary, lesson, quiz, progress...) có một thư mục riêng, chứa đầy đủ route – controller – service – validation của chính nó. Khi cần sửa hay thêm tính năng nào, chỉ cần vào đúng thư mục module đó, không phải nhảy qua nhiều nơi khác nhau. Cách tổ chức này cũng giúp team làm việc song song mà ít bị đụng file, conflict Git.

- **`auth/`** — đăng ký, đăng nhập, refresh token, quên mật khẩu.
- **`user/`** — quản lý thông tin tài khoản, hồ sơ cá nhân, đổi mật khẩu.
- **`vocabulary/`** — quản lý kho từ vựng: thêm/sửa/xoá từ, phiên âm, ví dụ, audio phát âm, cấp độ (A1, A2, B1...).
- **`lesson/`** — quản lý bài học: nội dung bài, sắp xếp theo chủ đề/cấp độ.
- **`quiz/`** — bài kiểm tra, câu hỏi trắc nghiệm, chấm điểm.
- **`progress/`** — theo dõi tiến độ học của người dùng: đã học bài nào, điểm quiz, số từ đã ôn (phù hợp nếu sau này làm thêm tính năng ôn tập kiểu spaced repetition).

Trong mỗi module:
- **`*.routes.js`** — khai báo các endpoint (URL + method) của module, ví dụ `POST /login`, `GET /vocabulary`.
- **`*.controller.js`** — nhận request từ route, gọi đến service tương ứng, rồi trả response về client. Không chứa logic nghiệp vụ phức tạp ở đây.
- **`*.service.js`** — nơi chứa logic nghiệp vụ thực sự (xử lý dữ liệu, gọi query DB, tính toán...). Tách riêng khỏi controller để dễ test và tái sử dụng.
- **`*.validation.js`** — kiểm tra dữ liệu đầu vào từ client (email đúng định dạng, mật khẩu đủ độ dài...) trước khi đưa vào service, tránh dữ liệu rác/lỗi lọt vào DB.

### `src/common/`
Chứa những thành phần dùng chung cho **toàn bộ ứng dụng**, không thuộc riêng module nào.

- **`middlewares/`** — các hàm middleware chạy trước/sau route:
  - `auth.middleware.js`: xác thực JWT token, kiểm tra người dùng đã đăng nhập chưa trước khi cho truy cập route cần bảo vệ.
  - `error.middleware.js`: bắt mọi lỗi xảy ra trong app (từ controller, service, DB...) và trả về response lỗi thống nhất một định dạng, tránh mỗi nơi tự xử lý lỗi theo kiểu riêng.
- **`utils/`** — hàm tiện ích dùng lại nhiều nơi:
  - `generateToken.js`: tạo JWT token khi đăng nhập thành công.
  - `response.js`: chuẩn hoá format response trả về (ví dụ luôn có `success`, `message`, `data`).
- **`constants/`** — các hằng số dùng chung, ví dụ `roles.js` định nghĩa vai trò người dùng (`admin`, `student`...), tránh việc gõ tay chuỗi `"admin"` rải rác khắp nơi trong code.

### `src/config/`
Chứa cấu hình kết nối đến các dịch vụ bên ngoài. Hiện tại có `db.js` — khởi tạo connection pool tới MySQL bằng `mysql2`. Sau này nếu tích hợp thêm dịch vụ khác (Cloudinary lưu ảnh, Redis cache...) thì file cấu hình tương ứng cũng đặt ở đây.

### `src/routes/`
Chứa `index.js` — nơi **gộp** route của tất cả module lại thành một router tổng, gắn tiền tố API chung (ví dụ `/api/auth`, `/api/vocabulary`). File này chỉ làm nhiệm vụ import và `router.use()`, không chứa logic gì khác.

### `src/server.js`
Điểm khởi chạy (entry point) của toàn bộ ứng dụng: load biến môi trường, khởi tạo Express app, gắn middleware bảo mật (`helmet`, `cors`, `rate-limit`), gắn router, gắn middleware xử lý lỗi, kiểm tra kết nối DB, rồi mới cho server lắng nghe (`listen`) trên cổng chỉ định.

### `uploads/`
Nơi lưu tạm các file người dùng tải lên (ảnh đại diện, audio phát âm...) nếu bạn chọn lưu trực tiếp trên server thay vì dùng dịch vụ cloud storage. Thư mục này thường được thêm vào `.gitignore` vì chứa dữ liệu người dùng, không nên commit lên Git.

### `tests/`
Chứa các file kiểm thử (unit test, integration test) cho từng module, giúp đảm bảo logic nghiệp vụ hoạt động đúng khi code thay đổi. Cấu trúc con `tests/modules/` nên phản chiếu đúng cấu trúc của `src/modules/` để dễ đối chiếu module nào có test, module nào chưa.

### `.env` và `.env.example`
- `.env`: chứa biến môi trường thật (mật khẩu DB, secret key JWT, cổng chạy...). **Không commit lên Git.**
- `.env.example`: bản mẫu liệt kê tên các biến cần thiết nhưng không chứa giá trị thật, giúp thành viên mới clone project biết cần khai báo biến gì mà không lộ thông tin nhạy cảm.

### `.gitignore`
Khai báo những file/thư mục không muốn đưa lên Git, quan trọng nhất là `node_modules/`, `.env`, và `uploads/`.

### `package.json`
Khai báo thông tin dự án, script chạy (`npm run dev`, `npm start`), và danh sách thư viện (dependencies/devDependencies) đang sử dụng.

### `README.md`
Tài liệu mô tả tổng quan dự án: cách cài đặt, cách chạy, các biến môi trường cần thiết, hướng dẫn đóng góp code cho thành viên mới trong team.
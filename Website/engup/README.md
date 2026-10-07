# EngUp Admin (Website)

Giao diện quản trị theo thiết kế Stitch (`stitch_engup_admin_panel/`): React 19 + Vite + react-router-dom, CSS thuần theo `DESIGN.md` (không icon, không shadow).

## Chạy
```bash
cp .env.example .env     # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev              # http://localhost:5173
```
Đăng nhập bằng tài khoản có `role = admin` (API `POST /api/admin/auth/login`).

## Cấu trúc
```
src/
├─ constants/api.js        # TOÀN BỘ đường dẫn API (giống Mobile/src/services/api.ts)
├─ constants/index.js      # CEFR, loại đề, menu...
├─ services/               # apiClient (token + refresh, FormData) + service theo module
├─ context/ hooks/         # AuthContext, useAuth, useFetch, useDebounce, useFormState
├─ routes/                 # AppRoutes, ProtectedRoute
├─ components/
│  ├─ ui/                  # Button, Badge, Fields, Panel, Tabs, DataTable, Pagination, ConfirmDialog...
│  ├─ layout/              # AdminLayout, Sidebar, Topbar, PageHeader
│  ├─ common/              # LevelBadge, DeleteDialog
│  └─ dashboard/ users/ content/ approval/ tests/ logs/   # component theo từng màn
├─ pages/{auth,admin,not-found}
└─ utils/format.js
```

## Màn hình ↔ API
| Màn | API |
|---|---|
| Đăng nhập | `POST /admin/auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| Tổng quan | `GET /admin/dashboard/overview`, `GET /admin/content/pending` |
| Người dùng | `GET /admin/users`, `PUT /admin/users/:id/status` |
| Học liệu | `/vocabulary/words`, `/vocabulary/topics`, `/reading/articles`, `/listening/lessons`, `/admin/reading/articles`, `/admin/listening/lessons(/:id/audio)` |
| Duyệt nội dung | `GET /admin/content/pending`, `PUT /admin/content/:id/approve|reject` |
| Đề thi | `GET /tests`, `GET /tests/:id/questions`, `/admin/tests/test-sets`, `/admin/tests/questions`, `GET /admin/tests/attempts` |
| Nhật ký | `GET /admin/logs/errors`, `GET /admin/logs/audit` |

## Lưu ý Backend (cần xử lý để chạy đủ)
- `routes/index.js` **chưa mount** `admin-users` → màn Người dùng sẽ 404 cho tới khi thêm:
  `router.use('/admin/users', require('../modules/admin-users/admin-users.routes'));`
- `admin-content` (CRUD bài đọc / bài nghe + upload audio) **chưa mount** và `adminVocabularyRouter` chưa được export. Web đang gọi `/admin/reading/articles` và `/admin/listening/lessons` theo comment trong `admin-content.routes.js`; cần mount router đó ở `/admin` (không trùng `/admin/content` của duyệt nội dung).
- Từ vựng CRUD dùng `/vocabulary/words` (đã chạy, service tự kiểm tra role admin).

## Giới hạn do API hiện tại
- Tổng quan: không có API chuỗi thời gian nên thay biểu đồ 7 ngày bằng bảng "Lỗi hệ thống gần đây".
- Người dùng: lọc trình độ làm trên trang hiện tại; Học liệu: ô tìm kiếm lọc trên trang hiện tại.
- Duyệt nội dung: hàng đợi chỉ có loại, mã nội dung, thời gian; bài đọc chờ duyệt chưa xem trước được (API công khai chỉ trả bài đã duyệt).
- Đề thi: API không trả đáp án đúng nên chỉ hiện "Đáp án đúng" cho câu vừa tạo/sửa trong phiên; sửa câu hỏi để trống đáp án = giữ nguyên.

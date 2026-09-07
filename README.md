# EngUp — English Learning App

Ứng dụng học tiếng Anh gồm 2 phần: **Backend** (Node.js + Express + MySQL) và **Mobile** (Expo + React Native + TypeScript).

```
EngUp/
├── .github/
│   └── workflows/          # CI kiểm tra biên dịch & lint trước khi merge
├── Backend/                 # API server
├── Mobile/                  # Ứng dụng mobile
├── .gitignore
└── README.md
```

---

## 1. Yêu cầu môi trường

Trước khi setup, đảm bảo máy đã cài:

- **Node.js** phiên bản 20 trở lên
- **npm** (đi kèm Node.js)
- **MySQL Server** đang chạy (cho phần Backend)
- **Expo Go** (cài trên điện thoại, dùng để chạy thử Mobile) hoặc Android Studio/Xcode nếu chạy emulator

---

## 2. Setup lần đầu sau khi clone/pull dự án

### Bước 1 — Clone project

```bash
git clone https://github.com/XDhide/EngUp.git
cd EngUp
```

### Bước 2 — Setup Backend

```bash
cd Backend
npm install
```

Tạo file `.env` trong thư mục `Backend/` (copy từ `.env.example` nếu có), khai báo các biến sau:

```
PORT=5000
JWT_SECRET=your_jwt_secret_key

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=english_learning_db
```

> File `.env` không được commit lên Git (đã khai báo trong `.gitignore`). Mỗi máy/mỗi người tự tạo file này với thông tin MySQL riêng của mình.

Tạo database trong MySQL nếu chưa có:

```sql
CREATE DATABASE english_learning_db;
```

Chạy server ở chế độ development (tự restart khi sửa code):

```bash
npm run dev
```

Server chạy tại `http://localhost:5000`.

### Bước 3 — Setup Mobile

```bash
cd Mobile
npm install
```

Chạy ứng dụng:

```bash
npx expo start
```

Sau khi Expo khởi động:
- Quét mã QR bằng app **Expo Go** để chạy trên điện thoại thật.
- Nhấn `a` để chạy Android Emulator.
- Nhấn `w` để chạy trên trình duyệt (Web).

Nếu gặp lỗi cache, xoá cache và chạy lại:

```bash
npx expo start -c
```

### Lưu ý chung

- **Không commit** `node_modules/` — chạy `npm install` sau mỗi lần pull code mới có thay đổi `package.json`.
- Sau khi pull code mới, nếu `package.json` (Backend hoặc Mobile) có thay đổi, luôn chạy lại `npm install` ở đúng thư mục tương ứng trước khi chạy tiếp.

---

## 3. Quy trình làm việc với Git (Branching Workflow)

Dự án dùng mô hình 3 loại nhánh chính:

| Nhánh | Vai trò |
|---|---|
| `main` | Code ổn định, chỉ merge khi hoàn thành milestone/dự án, dùng để phát hành (release) |
| `dev` | Nhánh tích hợp — nơi dồn tất cả tính năng đã hoàn thành, luôn là bản mới nhất đã qua kiểm tra |
| `feature/<ten>` | Nhánh làm việc cho từng tính năng cụ thể, tạo mới cho mỗi tính năng, xoá sau khi merge |

Ngoài ra còn `fix/<ten>` (sửa lỗi thường) và `hotfix/<ten>` (sửa lỗi khẩn cấp trên `main`).

### Sơ đồ luồng nhánh

```
main   ──────●────────────────●─────────────►  (release)
              \                / 
dev    ────●───●───●───●───●──●───────────────►  (tích hợp)
             \   \   \   \
feature/..    ●   |   |   |
feature/..        ●   |   |
feature/..            ●   |
fix/..                    ●
```

### Các bước thực hiện khi làm một tính năng mới

**Bước 1 — Tạo nhánh feature từ `dev`**

```bash
git checkout dev
git pull origin dev
git checkout -b feature/ten-tinh-nang
```

**Bước 2 — Code, commit theo từng phần nhỏ, rõ ràng**

```bash
git add .
git commit -m "feat: mo ta ngan gon thay doi"
git push origin feature/ten-tinh-nang
```

**Bước 3 — Mở Pull Request vào `dev`**

- Tạo PR trên GitHub, đích đến là nhánh `dev` (không phải `main`).
- CI (`Backend CI` / `Mobile CI`) sẽ tự chạy kiểm tra:
  - Backend: cài dependency (`npm ci`) + kiểm tra lỗi cú pháp file `.js`.
  - Mobile: kiểm tra kiểu dữ liệu TypeScript (`tsc --noEmit`) + lint (`expo lint`).
- CI báo pass (xanh) mới được merge. Nếu làm nhóm, cần thêm ít nhất 1 người review trước khi merge.

**Bước 4 — Merge và dọn dẹp**

- Merge PR vào `dev`.
- Xoá nhánh `feature/ten-tinh-nang` sau khi merge xong.

**Bước 5 — Lặp lại cho các tính năng khác**, tất cả đều đổ về `dev`.

**Bước 6 — Khi dự án/milestone hoàn chỉnh, đưa `dev` lên `main`**

```bash
# Mở Pull Request: dev → main trên GitHub
# CI chạy kiểm tra lại lần cuối trên toàn bộ code
# Merge xong, gắn tag phiên bản:

git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### Quy tắc đặt tên nhánh & commit message

| Loại | Ví dụ |
|---|---|
| Nhánh tính năng | `feature/auth-login`, `feature/vocabulary-crud` |
| Nhánh sửa lỗi | `fix/token-expired` |
| Nhánh hotfix khẩn cấp | `hotfix/db-connection-crash` |
| Commit thêm tính năng | `feat: them API dang nhap` |
| Commit sửa lỗi | `fix: sua loi khong luu duoc token` |
| Commit chỉnh tài liệu | `docs: cap nhat huong dan setup` |

### Quy tắc bảo vệ nhánh (branch protection)

- Không push trực tiếp lên `main` và `dev` — mọi thay đổi đều phải qua Pull Request.
- PR bắt buộc phải để CI (`Backend CI`, `Mobile CI`) chạy pass mới được merge.

---

## 4. CI — Kiểm tra tự động trước khi merge

Workflow nằm trong `.github/workflows/`, tự động chạy khi có Pull Request vào `dev` hoặc `main`:

- **`backend-ci.yml`**: chạy khi có thay đổi trong `Backend/` — cài dependency và kiểm tra lỗi biên dịch (cú pháp) các file JavaScript.
- **`mobile-ci.yml`**: chạy khi có thay đổi trong `Mobile/` — kiểm tra kiểu dữ liệu TypeScript và lint code theo chuẩn Expo.

Nếu CI báo lỗi, xem log chi tiết ngay trong tab **Actions** trên GitHub hoặc trong chính Pull Request để biết chỗ nào cần sửa trước khi merge.

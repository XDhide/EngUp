## Mobile – Setup & Run

### 1. Clone project

```bash
git clone <repository-url>
cd EnglishLab/Mobile
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Chạy ứng dụng

```bash
npx expo start
```

Sau khi chạy Expo:

* Quét QR bằng **Expo Go** để chạy trên điện thoại.
* Nhấn `a` để chạy **Android Emulator**.
* Nhấn `w` để chạy trên **Web**.

### 4. Nếu gặp lỗi

Xóa cache Expo và chạy lại:

```bash
npx expo start -c
```

### Lưu ý

* Không cần commit `node_modules`.
* Sau khi clone project mới, luôn chạy `npm install` trước khi `npx expo start`.

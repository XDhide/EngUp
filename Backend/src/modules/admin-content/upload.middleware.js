const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../../common/utils/AppError');

// Lưu file audio vào Backend/uploads/audio/ — dùng chung thư mục uploads/ đã có sẵn
// trong cấu trúc repo (Backend/uploads/), tạo thêm thư mục con audio/ nếu chưa có.
const UPLOAD_DIR = path.join(__dirname, '../../../uploads/audio');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/ogg'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new AppError('Định dạng file audio không hợp lệ (chỉ chấp nhận mp3/wav/m4a/ogg)', 400));
  }
  cb(null, true);
}

const uploadAudio = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

module.exports = uploadAudio;

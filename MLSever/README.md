# MLSever — FastAPI chạy model đã train

Cùng cấp với `Backend/` và `Mobile/`. Server **chỉ nạp và chạy** model đã train từ Colab (không train trong server).
Chưa có model / model lỗi → tự động dùng fallback SM-2 (`used_fallback_sm2=true`), không làm sập Backend.

```
EngUp/
├── Backend/
├── Mobile/
├── MLSever/        ← thư mục này
└── docker-compose.yml
```

## 1. Xuất model từ Colab
Dán `scripts/colab_export_cell.py` vào cuối notebook, chạy, tải `recall_model.joblib` về đặt vào `MLSever/models/`.
File gồm: RandomForest Regressor + StandardScaler + feature_cols + version.
Đặt `scikit-learn==<phiên bản Colab in ra>` trong `requirements.txt` (pickle phải cùng phiên bản sklearn).

## 2. Chạy
```bash
cd MLSever
pip install -r requirements.txt
cp .env.example .env                    # sửa DB_*
uvicorn app.main:app --reload --port 8000     # Swagger: http://localhost:8000/docs
pytest
```
Chưa có model thật, muốn thử luồng: `python scripts/make_dummy_model.py` (model GIẢ, không dùng production).
Toàn hệ thống: `docker compose up --build` ở thư mục gốc.

## API
| | |
|---|---|
| `GET /health` | `{"status":"ok"}` |
| `POST /predict` | in `{user_id, word_id, review_history?: [{result, response_time_ms, reviewed_at}]}` → out `{success, message, data:{recall_probability, next_review_at, used_fallback_sm2, model_version, half_life_hours}}` (các field cũng lặp ở root cho `tryPredict()` của Backend) |
| `GET /metrics/accuracy?days=30&refresh=true` | so `ml_prediction_logs` với `review_logs`; cần header `X-Internal-Key` nếu đặt `INTERNAL_API_KEY` |

- Không gửi `review_history` → server tự đọc `review_logs` (chỉ đọc). Chỉ ghi vào `ml_prediction_logs`.
- Feature đúng notebook: `history_correct, history_wrong, history_accuracy, delta_days, log_delta`. "Nhớ" = hard/good/easy, "quên" = again.
- `recall_probability` = xác suất nhớ lúc gọi; `next_review_at` = lúc xác suất tụt xuống `TARGET_RETENTION` (0.85).
- Ít hơn `MIN_HISTORY_FOR_ML` (3) lần ôn → SM-2. Thời gian luôn là UTC.
- Thay model: ghi đè `models/recall_model.joblib` rồi restart server.

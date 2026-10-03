"""Tạo model GIẢ LẬP (đường cong quên tổng hợp) để chạy thử server khi chưa có model thật từ Colab.
    python scripts/make_dummy_model.py        ->  models/recall_model.joblib
KHÔNG dùng cho production."""
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.features import FEATURE_COLS, feature_dict  # noqa: E402


def build(n=6000, seed=0) -> dict:
    rng = np.random.default_rng(seed)
    rows, y = [], []
    for _ in range(n):
        c, w = int(rng.integers(1, 20)), int(rng.integers(0, 10))
        d = float(rng.choice([0.04, 0.5, 1, 2, 4, 8, 16, 32]))
        half = 0.5 * (1 + c) / (1 + w)                       # càng nhiều đúng, nhớ càng lâu
        rows.append(feature_dict(c, w, d))
        y.append(float(np.clip(2 ** (-d / half) + rng.normal(0, 0.05), 0, 1)))
    X = pd.DataFrame(rows, columns=FEATURE_COLS)
    scaler = StandardScaler().fit(X)
    model = RandomForestRegressor(n_estimators=60, max_depth=8, random_state=0, n_jobs=-1).fit(scaler.transform(X), y)
    return {"model": model, "scaler": scaler, "feature_cols": FEATURE_COLS,
            "version": "dummy-synthetic", "sklearn_version": sklearn.__version__}


if __name__ == "__main__":
    out = Path(__file__).resolve().parents[1] / "models" / "recall_model.joblib"
    joblib.dump(build(), out, compress=3)
    print("Đã tạo model giả:", out)

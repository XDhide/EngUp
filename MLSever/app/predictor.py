"""Nạp model đã train (xuất từ Colab) và dự đoán. Không huấn luyện trong server."""
from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Sequence

import joblib
import numpy as np
import pandas as pd

from .config import get_settings
from .features import FEATURE_COLS, feature_dict, is_recalled
from .sm2 import predict_sm2

log = logging.getLogger("ml.predictor")
_GRID_DAYS = np.geomspace(10 / 1440, 365, 60)  # 10 phút → 365 ngày


@dataclass
class ReviewEvent:
    result: str
    response_time_ms: Optional[int]
    reviewed_at: datetime  # naive UTC


@dataclass
class Prediction:
    recall_probability: float
    next_review_at: datetime
    used_fallback_sm2: bool
    model_version: Optional[str]
    half_life_hours: Optional[float] = None


def _crossing(grid, curve, level) -> Optional[float]:
    below = np.where(curve <= level)[0]
    if below.size == 0:
        return None
    i = int(below[0])
    if i == 0:
        return float(grid[0])
    hi, lo = float(curve[i - 1]), float(curve[i])
    t = (hi - level) / (hi - lo) if hi > lo else 1.0
    return float(math.exp(math.log(grid[i - 1]) + t * (math.log(grid[i]) - math.log(grid[i - 1]))))


def load_bundle(path: str) -> Optional[dict]:
    """Bundle hợp lệ: {model, scaler, feature_cols, version}. Sai/thiếu -> None (server dùng SM-2)."""
    p = Path(path)
    if not p.exists():
        log.warning("Chưa có file model %s — dùng fallback SM-2.", p)
        return None
    try:
        b = joblib.load(p)
        missing = {"model", "scaler", "feature_cols", "version"} - set(b)
        if missing:
            raise ValueError(f"bundle thiếu key: {sorted(missing)}")
        if list(b["feature_cols"]) != FEATURE_COLS:
            raise ValueError(f"feature_cols lệch: {b['feature_cols']} != {FEATURE_COLS}")
        import sklearn
        if b.get("sklearn_version") and b["sklearn_version"] != sklearn.__version__:
            log.warning("sklearn lệch phiên bản: model=%s server=%s", b["sklearn_version"], sklearn.__version__)
        return b
    except Exception:
        log.exception("Không nạp được model %s — dùng fallback SM-2.", p)
        return None


class Predictor:
    def __init__(self) -> None:
        self._bundle: Optional[dict] = None

    def set_bundle(self, bundle: Optional[dict]) -> None:
        self._bundle = bundle

    @property
    def model_version(self) -> Optional[str]:
        return self._bundle["version"] if self._bundle else None

    @property
    def loaded(self) -> bool:
        return self._bundle is not None

    def _proba(self, bundle: dict, rows: list[dict]) -> np.ndarray:
        X = pd.DataFrame(rows, columns=bundle["feature_cols"])
        return np.clip(bundle["model"].predict(bundle["scaler"].transform(X)), 0.0, 1.0)

    def predict(self, history: Sequence[ReviewEvent], now: datetime) -> Prediction:
        return self.predict_many([(history, now)])[0]

    def predict_many(self, requests: Sequence[tuple[Sequence[ReviewEvent], datetime]]) -> list[Prediction]:
        cfg = get_settings()
        bundle = self._bundle
        prepared = []
        rows: list[dict] = []

        for history, now in requests:
            history = sorted(history, key=lambda e: e.reviewed_at)
            if bundle is None or len(history) < cfg.min_history_for_ml:
                prepared.append((history, now, None))
                continue
            correct = sum(1 for e in history if is_recalled(e.result))
            wrong = len(history) - correct
            last_at = history[-1].reviewed_at
            elapsed = max((now - last_at).total_seconds() / 86400, 0.0)
            start = len(rows)
            rows.append(feature_dict(correct, wrong, elapsed))
            rows.extend(feature_dict(correct, wrong, d) for d in _GRID_DAYS)
            prepared.append((history, now, (start, last_at)))

        probs = self._proba(bundle, rows) if rows else np.empty(0)
        grid_n = len(_GRID_DAYS)
        out: list[Prediction] = []

        for history, now, meta in prepared:
            if meta is None:
                sm2 = predict_sm2(history, now)
                out.append(Prediction(sm2.recall_probability, sm2.next_review_at, True, None))
                continue

            start, last_at = meta
            p_now = float(probs[start])
            curve = np.minimum.accumulate(probs[start + 1:start + 1 + grid_n])

            delta = _crossing(_GRID_DAYS, curve, cfg.target_retention)
            if delta is None:
                delta = float(_GRID_DAYS[-1])
            half = _crossing(_GRID_DAYS, curve, 0.5)

            sm2 = predict_sm2(history, now)
            cap = min(cfg.max_interval_days, max(cfg.max_sm2_multiple * sm2.interval_days, 1.0))
            delta = min(delta, cap)
            out.append(Prediction(
                recall_probability=round(p_now, 4),
                next_review_at=max(last_at + timedelta(days=delta), now),
                used_fallback_sm2=False,
                model_version=bundle["version"],
                half_life_hours=round(half * 24, 2) if half is not None else None,
            ))
        return out


predictor = Predictor()

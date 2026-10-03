"""SM-2 fallback — khớp với `computeSm2Update` trong Backend/vocabulary.service.js
để kết quả của ML-Service và Backend không lệch nhau khi cold-start."""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Sequence

AGAIN_RETRY_MINUTES = 10
INITIAL_EASE = 2.5


def _round(x: float) -> int:  # JS Math.round (làm tròn nửa lên), khác round() của Python
    return int(math.floor(x + 0.5))


def apply_review(ease: float, interval: int, reps: int, result: str) -> tuple[float, int, int]:
    if result == "again":
        return max(1.3, ease - 0.2), 0, 0
    if result == "hard":
        return max(1.3, ease - 0.15), max(1, _round((interval or 1) * 1.2)), reps + 1
    if result == "good":
        if reps == 0:
            interval = 1
        elif reps == 1:
            interval = 6
        else:
            interval = _round(interval * ease)
        return ease, interval, reps + 1
    if result == "easy":
        return ease + 0.15, _round((interval or 1) * ease * 1.3), reps + 1
    raise ValueError(f"result không hợp lệ: {result}")


@dataclass
class Sm2Prediction:
    recall_probability: float
    next_review_at: datetime
    interval_days: float


def predict_sm2(history: Sequence, now: datetime) -> Sm2Prediction:
    """history: các object có .result/.reviewed_at, đã sắp xếp tăng dần theo thời gian."""
    if not history:  # từ chưa từng ôn -> cần học ngay
        return Sm2Prediction(0.0, now, 0.0)

    ease, interval, reps = INITIAL_EASE, 0, 0
    for ev in history:
        ease, interval, reps = apply_review(ease, interval, reps, ev.result)

    last_at = history[-1].reviewed_at
    if interval == 0:
        due = last_at + timedelta(minutes=AGAIN_RETRY_MINUTES)
        scale_days = AGAIN_RETRY_MINUTES / 1440
    else:
        due = last_at + timedelta(days=interval)
        scale_days = float(interval)

    elapsed_days = max((now - last_at).total_seconds() / 86400, 0.0)
    # Xấp xỉ đường cong quên: p = 0.9 đúng vào hạn ôn, giảm dần theo hàm mũ
    p = 0.9 ** (elapsed_days / scale_days)
    return Sm2Prediction(round(min(max(p, 0.0), 1.0), 4), max(due, now), float(interval))

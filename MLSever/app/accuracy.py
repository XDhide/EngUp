"""Theo dõi độ chính xác model: ghép ml_prediction_logs.actual_result từ review_logs rồi so sánh."""
from __future__ import annotations

import logging
from datetime import timedelta

import numpy as np
from sqlalchemy import select, update

from .config import get_settings
from .db import get_session
from .features import is_recalled
from .models import MlPredictionLog, ReviewLog
from .timeutil import utcnow

log = logging.getLogger("ml.accuracy")


def backfill_actual_results() -> int:
    """Điền actual_result = kết quả của lần ôn ĐẦU TIÊN sau lúc dự đoán (trong cửa sổ N giờ)."""
    cfg = get_settings()
    cutoff = utcnow() - timedelta(days=cfg.backfill_lookback_days)
    window = timedelta(hours=cfg.backfill_window_hours)

    with get_session() as s:
        stmt = (
            select(MlPredictionLog.id, MlPredictionLog.predicted_at, ReviewLog.result, ReviewLog.reviewed_at)
            .join(
                ReviewLog,
                (ReviewLog.user_id == MlPredictionLog.user_id)
                & (ReviewLog.word_id == MlPredictionLog.word_id)
                & (ReviewLog.reviewed_at > MlPredictionLog.predicted_at),
            )
            .where(MlPredictionLog.actual_result.is_(None), MlPredictionLog.predicted_at >= cutoff)
            .order_by(MlPredictionLog.id, ReviewLog.reviewed_at)
        )
        first: dict[int, str] = {}
        for log_id, predicted_at, result, reviewed_at in s.execute(stmt):
            if log_id not in first and reviewed_at - predicted_at <= window:
                first[log_id] = result
        for log_id, result in first.items():
            s.execute(update(MlPredictionLog).where(MlPredictionLog.id == log_id).values(actual_result=result))
        s.commit()
    return len(first)


def _summarize(rows: list[tuple[float, str]]) -> dict:
    if not rows:
        return {"n": 0}
    p = np.array([r[0] for r in rows], dtype=float)
    y = np.array([1.0 if is_recalled(r[1]) else 0.0 for r in rows])
    return {
        "n": int(len(rows)),
        "accuracy_at_0.5": round(float(((p >= 0.5) == (y == 1)).mean()), 4),
        "brier": round(float(((p - y) ** 2).mean()), 4),
        "mean_predicted": round(float(p.mean()), 4),
        "mean_actual": round(float(y.mean()), 4),
        # >0: model quá lạc quan (dự đoán nhớ nhiều hơn thực tế); <0: quá bi quan
        "calibration_gap": round(float(p.mean() - y.mean()), 4),
    }


def compute_accuracy(days: int = 30) -> dict:
    since = utcnow() - timedelta(days=days)
    with get_session() as s:
        rows = s.execute(
            select(
                MlPredictionLog.recall_probability,
                MlPredictionLog.actual_result,
                MlPredictionLog.used_fallback_sm2,
            ).where(MlPredictionLog.actual_result.is_not(None), MlPredictionLog.predicted_at >= since)
        ).all()
    ml = [(float(p), a) for p, a, fb in rows if not fb]
    sm2 = [(float(p), a) for p, a, fb in rows if fb]
    return {
        "window_days": days,
        "ml_model": _summarize(ml),
        "sm2_fallback": _summarize(sm2),
        "all": _summarize(ml + sm2),
    }


def run_accuracy_job(days: int = 30) -> dict:
    n = backfill_actual_results()
    report = compute_accuracy(days)
    log.info("accuracy-job: backfilled=%d report=%s", n, report)
    return {"backfilled": n, **report}

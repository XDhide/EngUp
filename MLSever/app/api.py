import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import select

from . import accuracy as accuracy_mod
from .config import get_settings
from .db import get_session
from .models import MlPredictionLog, ReviewLog
from .predictor import Prediction, ReviewEvent, predictor
from .schemas import PredictRequest
from .timeutil import iso_z, to_naive_utc, utcnow

log = logging.getLogger("ml.api")
router = APIRouter()


def require_internal_key(x_internal_key: str | None = Header(default=None)):
    key = get_settings().internal_api_key
    if key and x_internal_key != key:
        raise HTTPException(status_code=401, detail="Invalid internal key")


@router.get("/health")
def health():
    return {"status": "ok"}


def _fetch_history(user_id: int, word_id: int) -> list[ReviewEvent]:
    """Đọc READ-ONLY review_logs (không gọi API Vocabulary)."""
    try:
        with get_session() as s:
            rows = s.execute(
                select(ReviewLog.result, ReviewLog.response_time_ms, ReviewLog.reviewed_at)
                .where(ReviewLog.user_id == user_id, ReviewLog.word_id == word_id)
                .order_by(ReviewLog.reviewed_at.desc()).limit(500)
            ).all()
        return [ReviewEvent(r, rt, at) for r, rt, at in reversed(rows)]
    except Exception:
        log.exception("Không đọc được review_logs — coi như chưa có lịch sử")
        return []


def _log_prediction(user_id: int, word_id: int, pred: Prediction) -> None:
    """Best-effort: lỗi ghi log không làm hỏng /predict."""
    try:
        since = utcnow() - timedelta(minutes=get_settings().log_dedup_minutes)
        with get_session() as s:
            dup = s.execute(
                select(MlPredictionLog.id).where(
                    MlPredictionLog.user_id == user_id, MlPredictionLog.word_id == word_id,
                    MlPredictionLog.actual_result.is_(None), MlPredictionLog.predicted_at >= since,
                ).limit(1)
            ).first()
            if dup:
                return
            s.add(MlPredictionLog(
                user_id=user_id, word_id=word_id, recall_probability=pred.recall_probability,
                predicted_next_review_at=pred.next_review_at, used_fallback_sm2=pred.used_fallback_sm2,
                model_version=pred.model_version, predicted_at=utcnow(),
            ))
            s.commit()
    except Exception:
        log.exception("Không ghi được ml_prediction_logs")


@router.post("/predict")
def predict(req: PredictRequest):
    if req.review_history is not None:
        history = [ReviewEvent(h.result, h.response_time_ms, to_naive_utc(h.reviewed_at)) for h in req.review_history]
    else:
        history = _fetch_history(req.user_id, req.word_id)

    pred = predictor.predict(history, utcnow())
    _log_prediction(req.user_id, req.word_id, pred)
    data = {
        "recall_probability": pred.recall_probability,
        "next_review_at": iso_z(pred.next_review_at),
        "used_fallback_sm2": pred.used_fallback_sm2,
        "model_version": pred.model_version,
        "half_life_hours": pred.half_life_hours,
    }
    # `data` theo chuẩn Backend + bản phẳng cho tryPredict() (đọc root.recall_probability)
    return {"success": True, "message": "OK", "data": data, **data}


@router.get("/metrics/accuracy", dependencies=[Depends(require_internal_key)])
def metrics_accuracy(days: int = Query(30, ge=1, le=365), refresh: bool = False):
    data = accuracy_mod.run_accuracy_job(days) if refresh else accuracy_mod.compute_accuracy(days)
    return {"success": True, "message": "OK", "data": data}

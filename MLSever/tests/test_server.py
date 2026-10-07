from datetime import datetime, timedelta

import joblib
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app import accuracy
from app.features import feature_dict
from app.main import app
from app.predictor import ReviewEvent, load_bundle, predictor
from app.sm2 import apply_review, predict_sm2
from make_dummy_model import build

T0 = datetime(2026, 1, 1, 8)


@pytest.fixture(scope="module")
def bundle():
    return build(n=2500)


def hist(*days, result="good"):
    return [ReviewEvent(result, 1500, T0 + timedelta(days=d)) for d in days]


def test_feature_dict():
    f = feature_dict(8, 2, 3)
    assert f["history_accuracy"] == 0.8 and f["delta_days"] == 3 and f["log_delta"] == pytest.approx(1.3863, 3)


def test_sm2_matches_backend():
    e, i, r = 2.5, 0, 0
    for res, exp in [("good", 1), ("good", 6), ("good", 15)]:
        e, i, r = apply_review(e, i, r, res)
        assert i == exp
    assert predict_sm2([], T0).next_review_at == T0


def test_load_bundle_missing_and_valid(tmp_path, bundle):
    assert load_bundle(str(tmp_path / "nope.joblib")) is None
    p = tmp_path / "m.joblib"
    joblib.dump(bundle, p)
    assert load_bundle(str(p))["version"] == "dummy-synthetic"
    joblib.dump({"model": 1}, p)
    assert load_bundle(str(p)) is None                       # bundle sai định dạng -> fallback, không crash


def test_predict_ml_path(bundle):
    predictor.set_bundle(bundle)
    h = hist(0, 1, 3, 7)
    now = T0 + timedelta(days=30)
    p = predictor.predict(h, now)
    assert not p.used_fallback_sm2 and p.model_version == "dummy-synthetic"
    assert 0 <= p.recall_probability <= 1 and p.next_review_at >= now
    fresh = predictor.predict(h, h[-1].reviewed_at + timedelta(hours=1)).recall_probability
    stale = predictor.predict(h, h[-1].reviewed_at + timedelta(days=60)).recall_probability
    assert fresh > stale
    predictor.set_bundle(None)


def test_cold_start_and_no_model(bundle):
    predictor.set_bundle(bundle)
    assert predictor.predict(hist(0), T0 + timedelta(hours=1)).used_fallback_sm2      # < min_history
    predictor.set_bundle(None)
    assert predictor.predict(hist(0, 1, 3, 7), T0 + timedelta(days=8)).used_fallback_sm2


def test_api(engine, bundle):
    predictor.set_bundle(bundle)
    c = TestClient(app)
    assert c.get("/health").json()["status"] == "ok"
    body = {"user_id": 1, "word_id": 2, "review_history": [
        {"result": "good", "response_time_ms": 1200, "reviewed_at": f"2026-01-0{d}T08:00:00Z"} for d in (1, 2, 4)]}
    j = c.post("/predict", json=body).json()
    assert j["success"] and j["data"]["used_fallback_sm2"] is False
    assert j["recall_probability"] == j["data"]["recall_probability"]
    c.post("/predict", json=body)
    with engine.connect() as conn:
        assert conn.execute(text("select count(*) from ml_prediction_logs")).scalar() == 1
    assert c.post("/predict", json={"user_id": 0, "word_id": 1}).status_code == 422


def test_predict_reads_review_logs_when_no_history(engine, bundle):
    predictor.set_bundle(bundle)
    with engine.begin() as conn:
        for d in (0, 1, 3, 7):
            conn.execute(text("insert into review_logs (card_id,user_id,word_id,result,reviewed_at) "
                              "values (1,7,9,'good',:t)"), {"t": T0 + timedelta(days=d)})
    j = TestClient(app).post("/predict", json={"user_id": 7, "word_id": 9}).json()
    assert j["success"] and j["data"]["used_fallback_sm2"] is False


def test_accuracy_job(engine):
    from app.timeutil import utcnow
    now = utcnow()
    with engine.begin() as conn:
        conn.execute(text("insert into ml_prediction_logs (user_id,word_id,recall_probability,"
                          "predicted_next_review_at,used_fallback_sm2,predicted_at) values (1,1,0.9,:n,0,:p)"),
                     {"n": now, "p": now - timedelta(hours=2)})
        conn.execute(text("insert into review_logs (card_id,user_id,word_id,result,reviewed_at) "
                          "values (1,1,1,'good',:t)"), {"t": now - timedelta(hours=1)})
    out = accuracy.run_accuracy_job(30)
    assert out["backfilled"] == 1 and out["ml_model"]["n"] == 1


def test_ml_schedule_is_capped(bundle):
    predictor.set_bundle(bundle)
    h = hist(0, 1, 3, 7)
    p = predictor.predict(h, h[-1].reviewed_at + timedelta(hours=1))
    assert p.next_review_at <= h[-1].reviewed_at + timedelta(days=60)
    predictor.set_bundle(None)

"""Feature đúng như notebook Colab (cell 18/21):
history_correct, history_wrong, history_accuracy, delta_days, log_delta
Server tính feature từ review_history rồi đưa qua scaler + model đã train.
"Nhớ" = result ∈ {hard, good, easy}; "quên" = again.
"""
import math

RECALLED_RESULTS = frozenset({"hard", "good", "easy"})
FEATURE_COLS = ["history_correct", "history_wrong", "history_accuracy", "delta_days", "log_delta"]


def is_recalled(result: str) -> bool:
    return result in RECALLED_RESULTS


def feature_dict(correct: int, wrong: int, delta_days: float) -> dict:
    seen = correct + wrong
    delta_days = max(float(delta_days), 0.0)
    return {
        "history_correct": float(correct),
        "history_wrong": float(wrong),
        "history_accuracy": correct / seen if seen else 0.5,
        "delta_days": delta_days,
        "log_delta": math.log1p(delta_days),
    }

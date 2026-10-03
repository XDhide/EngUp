from datetime import datetime, timezone


def utcnow() -> datetime:
    """Naive UTC (khớp cột DATETIME của MySQL; hệ thống giả định DB lưu UTC)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_naive_utc(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def iso_z(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

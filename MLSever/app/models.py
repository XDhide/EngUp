"""SQLAlchemy models.

* MlPredictionLog — bảng do module ML-Service SỞ HỮU (Backend đã có Sequelize model
  `ml_prediction_logs`; ở đây là bản ánh xạ để ghi/đọc, KHÔNG create_all trên prod).
* ReviewLog       — bảng của module Vocabulary, ML-Service chỉ ĐỌC (read-only).
"""
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, Integer, Numeric, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

RESULT_ENUM = Enum("again", "hard", "good", "easy", name="review_result")
_PK = BigInteger().with_variant(Integer, "sqlite")


class Base(DeclarativeBase):
    pass


class MlPredictionLog(Base):
    __tablename__ = "ml_prediction_logs"

    id: Mapped[int] = mapped_column(_PK, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    word_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    recall_probability: Mapped[float] = mapped_column(Numeric(5, 4, asdecimal=False), nullable=False)
    predicted_next_review_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used_fallback_sm2: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    model_version: Mapped[str | None] = mapped_column(String(50))
    actual_result: Mapped[str | None] = mapped_column(RESULT_ENUM)
    predicted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class ReviewLog(Base):
    """READ-ONLY. Không bao giờ insert/update bảng này từ ML-Service."""

    __tablename__ = "review_logs"

    id: Mapped[int] = mapped_column(_PK, primary_key=True)
    card_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    word_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    result: Mapped[str] = mapped_column(RESULT_ENUM, nullable=False)
    response_time_ms: Mapped[int | None] = mapped_column(Integer)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

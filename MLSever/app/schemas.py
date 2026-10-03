from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

Result = Literal["again", "hard", "good", "easy"]


class ReviewItem(BaseModel):
    result: Result
    response_time_ms: Optional[int] = Field(default=None, ge=0)
    reviewed_at: datetime


class PredictRequest(BaseModel):
    user_id: int = Field(ge=1)
    word_id: int = Field(ge=1)
    # Tuỳ chọn: nếu Backend không gửi, ML-Service tự đọc review_logs (read-only) của cặp user/word.
    review_history: Optional[List[ReviewItem]] = Field(default=None, max_length=500)

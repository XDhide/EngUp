from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "EngUp_database"
    database_url: Optional[str] = None

    model_path: str = "./models/recall_model.joblib"
    min_history_for_ml: int = 3
    target_retention: float = 0.85
    # Model Duolingo gần như phẳng theo thời gian -> chặn lịch ôn không vượt quá bội số của SM-2 và mức tối đa này
    max_interval_days: float = 60.0
    max_sm2_multiple: float = 2.0

    log_dedup_minutes: int = 60
    backfill_window_hours: int = 24
    backfill_lookback_days: int = 7
    internal_api_key: str = ""

    @property
    def sqlalchemy_url(self):
        if self.database_url:
            return self.database_url
        return URL.create(
            "mysql+pymysql", username=self.db_user, password=self.db_password,
            host=self.db_host, port=self.db_port, database=self.db_name,
            query={"charset": "utf8mb4"},
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()

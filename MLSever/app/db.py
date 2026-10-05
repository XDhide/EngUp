from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from .config import get_settings

_engine: Engine | None = None
_Session = None


def get_engine() -> Engine:
    global _engine, _Session
    if _engine is None:
        _engine = create_engine(
            get_settings().sqlalchemy_url, pool_pre_ping=True, pool_recycle=1800, future=True
        )
        _Session = sessionmaker(bind=_engine, expire_on_commit=False)
    return _engine


def get_session():
    get_engine()
    return _Session()


def set_engine_for_tests(engine: Engine) -> None:
    global _engine, _Session
    _engine = engine
    _Session = sessionmaker(bind=engine, expire_on_commit=False)

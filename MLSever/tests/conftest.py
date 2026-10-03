import os
import sys
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite://"
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

from app import db
from app.models import Base
from app.predictor import predictor


@pytest.fixture()
def engine():
    eng = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
    Base.metadata.create_all(eng)
    db.set_engine_for_tests(eng)
    predictor.set_bundle(None)
    yield eng
    predictor.set_bundle(None)

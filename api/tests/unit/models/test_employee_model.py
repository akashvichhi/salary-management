from collections.abc import Iterator
from datetime import datetime

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.constants.time_constants import APP_TIMEZONE
from app.core.database import create_database_engine, create_session_factory
from app.models import base_model
from app.models.base_model import Base
from tests.factories import build_employee

IN_MEMORY_DATABASE_URL = "sqlite://"
CREATED_AT = datetime(2026, 1, 1, 9, 0, tzinfo=APP_TIMEZONE)
UPDATED_AT = datetime(2026, 2, 1, 9, 0, tzinfo=APP_TIMEZONE)


@pytest.fixture
def session() -> Iterator[Session]:
    engine = create_database_engine(IN_MEMORY_DATABASE_URL)
    # Tests only: production schemas come from Alembic migrations.
    Base.metadata.create_all(engine)
    with create_session_factory(engine)() as db_session:
        yield db_session
    engine.dispose()


def set_clock(monkeypatch: pytest.MonkeyPatch, now: datetime) -> None:
    monkeypatch.setattr(base_model, "now_in_app_timezone", lambda: now)


def test_database_rejects_a_duplicate_email(session: Session) -> None:
    session.add(build_employee(email="asha.rao@acme.com"))
    session.commit()

    session.add(build_employee(full_name="Another Asha", email="asha.rao@acme.com"))

    with pytest.raises(IntegrityError):
        session.commit()


def test_new_employee_gets_created_and_updated_times_in_ist(
    session: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    set_clock(monkeypatch, CREATED_AT)
    employee = build_employee()
    session.add(employee)
    session.commit()
    session.expire_all()

    assert employee.created_at == CREATED_AT
    assert employee.updated_at == CREATED_AT
    assert employee.created_at.utcoffset() == APP_TIMEZONE.utcoffset(None)


def test_updating_an_employee_changes_only_updated_at(
    session: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    set_clock(monkeypatch, CREATED_AT)
    employee = build_employee()
    session.add(employee)
    session.commit()

    set_clock(monkeypatch, UPDATED_AT)
    employee.job_title = "Senior Software Engineer"
    session.commit()
    session.expire_all()

    assert employee.created_at == CREATED_AT
    assert employee.updated_at == UPDATED_AT

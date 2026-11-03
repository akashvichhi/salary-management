from datetime import UTC, datetime

from sqlalchemy.dialects import sqlite

from app.constants.time_constants import APP_TIMEZONE
from app.models.base_model import AppDateTime

DIALECT = sqlite.dialect()


def test_app_datetime_stores_any_timezone_as_naive_ist() -> None:
    utc_time = datetime(2026, 1, 1, 9, 0, tzinfo=UTC)

    stored = AppDateTime().process_bind_param(utc_time, DIALECT)

    assert stored == datetime(2026, 1, 1, 14, 30)


def test_app_datetime_reads_values_back_as_aware_ist() -> None:
    loaded = AppDateTime().process_result_value(datetime(2026, 1, 1, 14, 30), DIALECT)

    assert loaded == datetime(2026, 1, 1, 14, 30, tzinfo=APP_TIMEZONE)
    assert loaded is not None
    assert loaded.isoformat() == "2026-01-01T14:30:00+05:30"


def test_app_datetime_passes_missing_values_through() -> None:
    column_type = AppDateTime()

    assert column_type.process_bind_param(None, DIALECT) is None
    assert column_type.process_result_value(None, DIALECT) is None

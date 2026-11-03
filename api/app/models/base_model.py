from datetime import datetime

from sqlalchemy import DateTime, Dialect
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import TypeDecorator

from app.constants.time_constants import APP_TIMEZONE


def now_in_app_timezone() -> datetime:
    return datetime.now(APP_TIMEZONE)


class AppDateTime(TypeDecorator[datetime]):
    """Stores IST without an offset, and always reads it back as timezone-aware IST.

    SQLite has no timezone type, so without this a stored value comes back naive
    and its zone is lost. Values in any other zone are converted to IST first.
    """

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        return value.astimezone(APP_TIMEZONE).replace(tzinfo=None)

    def process_result_value(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        return value.replace(tzinfo=APP_TIMEZONE)


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    # The lambdas look up the clock on each call, so tests can replace it.
    created_at: Mapped[datetime] = mapped_column(
        AppDateTime, nullable=False, default=lambda: now_in_app_timezone()
    )
    updated_at: Mapped[datetime] = mapped_column(
        AppDateTime,
        nullable=False,
        default=lambda: now_in_app_timezone(),
        onupdate=lambda: now_in_app_timezone(),
    )

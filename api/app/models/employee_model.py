from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, Index, Numeric, String, text, true
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base_model import Base, TimestampMixin

COUNTRY_CODE_LENGTH = 2
SALARY_PRECISION = 12
SALARY_SCALE = 2


class EmployeeModel(TimestampMixin, Base):
    __tablename__ = "employees"
    # Why each index exists: docs/architecture.md, section 4.
    __table_args__ = (
        Index("ix_employees_country_job_title", "country", "job_title"),
        # Unique among active employees only, so a deleted employee's email can be reused.
        Index(
            "uq_employees_active_email",
            "email",
            unique=True,
            sqlite_where=text("is_active = 1"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String, nullable=False)
    job_title: Mapped[str] = mapped_column(String, nullable=False, index=True)
    department: Mapped[str] = mapped_column(String, nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(COUNTRY_CODE_LENGTH), nullable=False, index=True)
    salary: Mapped[Decimal] = mapped_column(
        Numeric(SALARY_PRECISION, SALARY_SCALE), nullable=False, index=True
    )
    hire_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    # Soft delete: a deleted employee keeps their row but is hidden everywhere.
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=true()
    )

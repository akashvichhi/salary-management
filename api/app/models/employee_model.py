from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base_model import Base, TimestampMixin

COUNTRY_CODE_LENGTH = 2
SALARY_PRECISION = 12
SALARY_SCALE = 2


class EmployeeModel(TimestampMixin, Base):
    __tablename__ = "employees"
    # Why each index exists: docs/architecture.md, section 4.
    __table_args__ = (Index("ix_employees_country_job_title", "country", "job_title"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    job_title: Mapped[str] = mapped_column(String, nullable=False, index=True)
    department: Mapped[str] = mapped_column(String, nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(COUNTRY_CODE_LENGTH), nullable=False, index=True)
    salary: Mapped[Decimal] = mapped_column(
        Numeric(SALARY_PRECISION, SALARY_SCALE), nullable=False, index=True
    )
    hire_date: Mapped[date] = mapped_column(Date, nullable=False)

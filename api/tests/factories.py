"""Deterministic test data builders. Each test states only the fields it cares about."""

from datetime import date
from decimal import Decimal
from typing import Any

from app.models.employee_model import EmployeeModel

DEFAULT_EMPLOYEE_FIELDS: dict[str, Any] = {
    "full_name": "Asha Rao",
    "email": "asha.rao@acme.com",
    "job_title": "Software Engineer",
    "department": "Engineering",
    "country": "IN",
    "salary": Decimal("85000.00"),
    "hire_date": date(2024, 3, 18),
}


def build_employee(**overrides: Any) -> EmployeeModel:
    return EmployeeModel(**{**DEFAULT_EMPLOYEE_FIELDS, **overrides})

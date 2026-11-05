"""Deterministic test data builders. Each test states only the fields it cares about."""

from datetime import date
from decimal import Decimal
from typing import Any

from app.core.security import hash_password
from app.models.employee_model import EmployeeModel
from app.models.user_model import UserModel
from app.schemas.requests.employee_request import EmployeeCreateRequest

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


def employee_payload(**overrides: Any) -> dict[str, Any]:
    """A JSON body for POST /employees, as the frontend would send it."""
    payload: dict[str, Any] = {
        **DEFAULT_EMPLOYEE_FIELDS,
        "salary": "85000.00",
        "hire_date": "2024-03-18",
    }
    return {**payload, **overrides}


def build_create_request(**overrides: Any) -> EmployeeCreateRequest:
    return EmployeeCreateRequest.model_validate(employee_payload(**overrides))


HR_MANAGER_EMAIL = "hr@acme.com"
HR_MANAGER_PASSWORD = "correct horse battery staple"


def build_user(email: str = HR_MANAGER_EMAIL, password: str = HR_MANAGER_PASSWORD) -> UserModel:
    return UserModel(email=email, password_hash=hash_password(password))


def login_payload(
    email: str = HR_MANAGER_EMAIL, password: str = HR_MANAGER_PASSWORD
) -> dict[str, str]:
    return {"email": email, "password": password}

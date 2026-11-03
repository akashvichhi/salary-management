from collections.abc import Callable
from datetime import date
from decimal import Decimal
from enum import StrEnum
from typing import Annotated

from pydantic import (
    AfterValidator,
    BaseModel,
    BeforeValidator,
    EmailStr,
    Field,
    StringConstraints,
    field_validator,
)

from app.constants.employee_constants import (
    FULL_NAME_MAX_LENGTH,
    SALARY_DECIMAL_PLACES,
    SALARY_MAX_DIGITS,
    Country,
    Department,
    JobTitle,
)
from app.constants.messages import FIELD_CANNOT_BE_NULL


def match_allowed_value[E: StrEnum](allowed: type[E]) -> Callable[[object], object]:
    """Maps ' engineering ' to 'Engineering', so only the spelling in the list is stored."""
    by_folded_value = {member.value.casefold(): member for member in allowed}

    def normalise(value: object) -> object:
        if not isinstance(value, str):
            return value
        return by_folded_value.get(value.strip().casefold(), value)

    return normalise


FullName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=FULL_NAME_MAX_LENGTH)
]
# Lowercased so uniqueness can't be bypassed with Asha@X.com vs asha@x.com.
Email = Annotated[EmailStr, AfterValidator(str.lower)]
CountryCode = Annotated[Country, BeforeValidator(match_allowed_value(Country))]
DepartmentName = Annotated[Department, BeforeValidator(match_allowed_value(Department))]
JobTitleName = Annotated[JobTitle, BeforeValidator(match_allowed_value(JobTitle))]
Salary = Annotated[
    Decimal, Field(gt=0, max_digits=SALARY_MAX_DIGITS, decimal_places=SALARY_DECIMAL_PLACES)
]


class EmployeeCreateRequest(BaseModel):
    full_name: FullName
    email: Email
    job_title: JobTitleName
    department: DepartmentName
    country: CountryCode
    salary: Salary
    hire_date: date


class EmployeeUpdateRequest(BaseModel):
    """PATCH body: only the fields that are sent change."""

    full_name: FullName | None = None
    email: Email | None = None
    job_title: JobTitleName | None = None
    department: DepartmentName | None = None
    country: CountryCode | None = None
    salary: Salary | None = None
    hire_date: date | None = None

    # None is only the "not sent" default; an explicit null would blank a required column.
    @field_validator("*", mode="before")
    @classmethod
    def reject_null(cls, value: object) -> object:
        if value is None:
            raise ValueError(FIELD_CANNOT_BE_NULL)
        return value

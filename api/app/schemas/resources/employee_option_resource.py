from pydantic import BaseModel

from app.constants.currency_constants import Currency


class CountryOptionResource(BaseModel):
    code: str
    name: str
    # The currency salaries in this country are entered and shown in.
    currency: Currency


class EmployeeOptionsResource(BaseModel):
    """The allowed values of the employee fields that are picked from a list."""

    countries: list[CountryOptionResource]
    departments: list[str]
    job_titles: list[str]

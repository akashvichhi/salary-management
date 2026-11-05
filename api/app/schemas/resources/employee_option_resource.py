from pydantic import BaseModel


class CountryOptionResource(BaseModel):
    code: str
    name: str


class EmployeeOptionsResource(BaseModel):
    """The allowed values of the employee fields that are picked from a list."""

    countries: list[CountryOptionResource]
    departments: list[str]
    job_titles: list[str]

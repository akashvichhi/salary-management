from app.constants.employee_constants import COUNTRY_NAMES, Country, Department, JobTitle
from app.schemas.resources.employee_option_resource import (
    CountryOptionResource,
    EmployeeOptionsResource,
)


class EmployeeOptionService:
    """Serves the fixed lists, so the web app's dropdowns never keep a copy of their own."""

    def get_options(self) -> EmployeeOptionsResource:
        return EmployeeOptionsResource(
            countries=[
                CountryOptionResource(code=country, name=COUNTRY_NAMES[country])
                for country in Country
            ],
            departments=list(Department),
            job_titles=list(JobTitle),
        )

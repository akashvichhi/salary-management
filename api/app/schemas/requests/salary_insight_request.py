from pydantic import BaseModel

from app.schemas.requests.employee_request import CountryCode


class SalaryByJobTitleRequest(BaseModel):
    """Job titles are compared within one country, since pay levels differ by country."""

    country: CountryCode

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.common.money_schema import Money


class EmployeeResource(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    job_title: str
    department: str
    country: str
    salary: Money
    hire_date: date
    created_at: datetime
    updated_at: datetime

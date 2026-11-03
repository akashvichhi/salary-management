from pydantic import BaseModel


class HealthResource(BaseModel):
    status: str

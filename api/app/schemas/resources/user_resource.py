from pydantic import BaseModel, ConfigDict


class UserResource(BaseModel):
    """Never the password hash."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str

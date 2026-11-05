from typing import Annotated

from pydantic import BaseModel, Field, SecretStr

from app.schemas.requests.employee_request import Email


class LoginRequest(BaseModel):
    email: Email
    # SecretStr keeps the password out of reprs and tracebacks; it is never trimmed.
    password: Annotated[SecretStr, Field(min_length=1)]

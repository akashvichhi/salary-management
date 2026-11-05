from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_DATABASE_URL = "sqlite:///./salary_management.db"
DEFAULT_SESSION_COOKIE_NAME = "session_id"
DEFAULT_SESSION_TTL_HOURS = 8


class Settings(BaseSettings):
    """The only place environment variables are read."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = DEFAULT_DATABASE_URL
    # Browser origins allowed to call the API from another port (the Vite dev server).
    # Empty in production, where FastAPI serves the web app from the same origin.
    allowed_origins: list[str] = []
    session_cookie_name: str = DEFAULT_SESSION_COOKIE_NAME
    session_ttl_hours: int = DEFAULT_SESSION_TTL_HOURS
    # Browsers send a Secure cookie over HTTPS only; turned off only for local http development.
    cookie_secure: bool = True
    # The HR manager the seed script creates. Read by the seed only, never by the running app.
    hr_manager_email: str | None = None
    hr_manager_password: SecretStr | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()

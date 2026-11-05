from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_DATABASE_URL = "sqlite:///./salary_management.db"


class Settings(BaseSettings):
    """The only place environment variables are read."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = DEFAULT_DATABASE_URL
    # Browser origins allowed to call the API from another port (the Vite dev server).
    # Empty in production, where FastAPI serves the web app from the same origin.
    allowed_origins: list[str] = []


@lru_cache
def get_settings() -> Settings:
    return Settings()

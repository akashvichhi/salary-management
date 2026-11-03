from fastapi import FastAPI

from app.api.v1.routers.health_router import health_router
from app.core.config import Settings, get_settings
from app.core.database import create_database_engine, create_session_factory
from app.core.exception_handlers import register_exception_handlers

APP_TITLE = "Salary Management API"


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()
    app = FastAPI(title=APP_TITLE)
    engine = create_database_engine(app_settings.database_url)
    app.state.session_factory = create_session_factory(engine)
    register_exception_handlers(app)
    app.include_router(health_router)
    return app


app = create_app()

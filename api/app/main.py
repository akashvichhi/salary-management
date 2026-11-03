from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.api_router import api_v1_router
from app.api.v1.routers.health_router import health_router
from app.core.config import Settings, get_settings
from app.core.database import create_database_engine, create_session_factory
from app.core.exception_handlers import register_exception_handlers

APP_TITLE = "Salary Management API"


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()
    engine = create_database_engine(app_settings.database_url)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncGenerator[None]:
        yield
        # Closes pooled SQLite connections, so none are left open after shutdown.
        engine.dispose()

    app = FastAPI(title=APP_TITLE, lifespan=lifespan)
    app.state.session_factory = create_session_factory(engine)
    register_exception_handlers(app)
    app.include_router(health_router)
    app.include_router(api_v1_router)
    return app


app = create_app()

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.v1.api_router import api_v1_router
from app.api.v1.routers.health_router import health_router
from app.core.config import Settings, get_settings
from app.core.database import create_database_engine, create_session_factory
from app.core.exception_handlers import register_exception_handlers
from app.core.logging_filters import install_access_log_filter

APP_TITLE = "Salary Management API"
# Below about 1 KB, compressing costs more time than it saves on the wire.
GZIP_MINIMUM_SIZE_BYTES = 1000
CORS_ALLOWED_METHODS = ["GET", "POST", "PATCH", "DELETE"]
CORS_ALLOWED_HEADERS = ["Content-Type"]


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()
    install_access_log_filter()
    engine = create_database_engine(app_settings.database_url)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncGenerator[None]:
        yield
        # Closes pooled SQLite connections, so none are left open after shutdown.
        engine.dispose()

    app = FastAPI(title=APP_TITLE, lifespan=lifespan)
    app.state.settings = app_settings
    app.state.session_factory = create_session_factory(engine)
    app.add_middleware(GZipMiddleware, minimum_size=GZIP_MINIMUM_SIZE_BYTES)
    if app_settings.allowed_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=app_settings.allowed_origins,
            allow_credentials=True,
            allow_methods=CORS_ALLOWED_METHODS,
            allow_headers=CORS_ALLOWED_HEADERS,
        )
    register_exception_handlers(app)
    app.include_router(health_router)
    app.include_router(api_v1_router)
    return app


app = create_app()

from logging.config import fileConfig

from alembic import context

from app.core.config import get_settings
from app.core.database import create_database_engine

# Imported to register their tables on Base.metadata.
from app.models import employee_model, session_model, user_model  # noqa: F401
from app.models.base_model import Base

config = context.config

if config.config_file_name is not None:
    # Keep the app's own loggers working when migrations run inside the app or tests.
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = Base.metadata


def database_url() -> str:
    # Tests point Alembic at a temporary database; everywhere else it follows DATABASE_URL.
    return config.get_main_option("sqlalchemy.url") or get_settings().database_url


def run_migrations_offline() -> None:
    context.configure(
        url=database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # The app's engine factory, so migrations get the same SQLite pragmas as the app.
    engine = create_database_engine(database_url())
    with engine.connect() as connection:
        # Batch mode lets later migrations alter columns, which SQLite can't do in place.
        context.configure(
            connection=connection, target_metadata=target_metadata, render_as_batch=True
        )
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

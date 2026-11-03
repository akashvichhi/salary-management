from collections.abc import Iterator

from fastapi import Request
from sqlalchemy import Engine, create_engine, event, text
from sqlalchemy.engine.interfaces import DBAPIConnection
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import ConnectionPoolEntry

# FastAPI runs plain `def` endpoints and dependencies in a thread pool, so one
# request may use its connection from more than one thread.
SQLITE_CONNECT_ARGS = {"check_same_thread": False}

# SQLite ignores foreign keys unless asked, and WAL lets reads continue during a write.
SQLITE_PRAGMAS = ("PRAGMA foreign_keys = ON", "PRAGMA journal_mode = WAL")


def apply_sqlite_pragmas(connection: DBAPIConnection, _: ConnectionPoolEntry) -> None:
    cursor = connection.cursor()
    for pragma in SQLITE_PRAGMAS:
        cursor.execute(pragma)
    cursor.close()


def create_database_engine(database_url: str) -> Engine:
    engine = create_engine(database_url, connect_args=SQLITE_CONNECT_ARGS)
    event.listen(engine, "connect", apply_sqlite_pragmas)
    return engine


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db(request: Request) -> Iterator[Session]:
    session_factory: sessionmaker[Session] = request.app.state.session_factory
    with session_factory() as session:
        yield session


def check_database_connection(session: Session) -> None:
    session.execute(text("SELECT 1"))

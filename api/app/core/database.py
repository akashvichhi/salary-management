from collections.abc import Iterator

from fastapi import Request
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.orm import Session, sessionmaker

# FastAPI runs plain `def` endpoints and dependencies in a thread pool, so one
# request may use its connection from more than one thread.
SQLITE_CONNECT_ARGS = {"check_same_thread": False}


def create_database_engine(database_url: str) -> Engine:
    return create_engine(database_url, connect_args=SQLITE_CONNECT_ARGS)


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db(request: Request) -> Iterator[Session]:
    session_factory: sessionmaker[Session] = request.app.state.session_factory
    with session_factory() as session:
        yield session


def check_database_connection(session: Session) -> None:
    session.execute(text("SELECT 1"))

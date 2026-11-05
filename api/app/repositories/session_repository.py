from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.session_model import SessionModel


class SessionRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, user_session: SessionModel) -> SessionModel:
        self.session.add(user_session)
        self.session.flush()
        return user_session

    def find_by_token_hash(self, token_hash: str) -> SessionModel | None:
        query = select(SessionModel).where(SessionModel.token_hash == token_hash)
        return self.session.scalar(query)

    def delete(self, user_session: SessionModel) -> None:
        self.session.delete(user_session)
        self.session.flush()

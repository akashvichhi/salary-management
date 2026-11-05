from sqlalchemy.orm import Session

from app.models.session_model import SessionModel


class SessionRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, user_session: SessionModel) -> SessionModel:
        self.session.add(user_session)
        self.session.flush()
        return user_session

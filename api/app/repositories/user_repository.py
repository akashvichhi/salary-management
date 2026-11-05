from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_model import UserModel


class UserRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, user: UserModel) -> UserModel:
        self.session.add(user)
        self.session.flush()
        return user

    def find_by_email(self, email: str) -> UserModel | None:
        return self.session.scalar(select(UserModel).where(UserModel.email == email))

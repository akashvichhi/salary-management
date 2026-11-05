from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base_model import Base, TimestampMixin


class UserModel(TimestampMixin, Base):
    """The HR manager. One user, no roles or sign-up (docs/requirements.md)."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Stored lowercased, like employee emails, so login ignores the case.
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
